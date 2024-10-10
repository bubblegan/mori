import { fromBuffer } from "pdf2pic";
import { createWorker } from "tesseract.js";
import { serve } from "@hono/node-server";
import Redis from "ioredis";
import { cors } from "hono/cors";
import { Queue, Worker } from "bullmq";
import yauzl from "yauzl";
import { Hono } from "hono";
import OpenAI from "openai";
import { generateParsingPrompt } from "./generate-parsing-prompt.js";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  host: "redis", // The Redis service name defined in Docker Compose
  port: 6379,
});

const app = new Hono();

const TRIM_TEXT = [
  "UPDATE YOUR MAILING ADDRESS",
  "INFORMATION ABOUT THE AMERICAN EXPRESS CARD",
  "Protect Yourself from Fraud ",
];

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a new connection in every instance
const myQueue = new Queue("process_file", {
  connection: {
    host: "redis",
    port: 6379,
  },
});

const myWorker = new Worker(
  "process_file",
  async (job) => {
    let pdfText = "";
    const fileBuffer = Buffer.from(job.data.buffer.data);
    const bufferResponses = await fromBuffer(fileBuffer, {
      density: 200,
      format: "png",
      width: 2000,
      height: 2000,
    }).bulk(-1, { responseType: "buffer" });

    const categoryStr = await redis.get(`category:${job.data.userId}`);
    const category = JSON.parse(categoryStr || "");

    console.log(job.data.name, ": start OCR");

    for (let i = 0; i < bufferResponses.length; i++) {
      let image = bufferResponses[i].buffer;
      if (image) {
        const worker = await createWorker("eng");
        const ret = await worker.recognize(image);
        pdfText += ret.data.text;
        await worker.terminate();
      }
    }

    console.log(job.data.name, ": finish OCR");

    // trimming
    TRIM_TEXT.forEach((text) => {
      if (pdfText.includes(text)) {
        pdfText = pdfText.substring(0, pdfText.indexOf(text));
      }
    });

    // generate
    const prompt = generateParsingPrompt(pdfText, category);

    console.log(job.data.name, ": start prompting");

    // prompt open AI
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
    });

    console.log(job.data.name, ": prompted");

    let promptValue = chatCompletion.choices[0].message.content || "";
    let fileValue = job.data.buffer.data;
    let key = "done:" + job.data.name;

    const value = {
      completion: promptValue,
      file: fileValue,
    };

    await redis.set(key, JSON.stringify(value));

    return "some value";
  },
  {
    connection: {
      host: "redis",
      port: 6379,
    },
  }
);

myWorker.on("failed", (reason) => {
  console.log(reason?.failedReason);
});

app.use("/*", cors());

app.get("/tasks/:userid", async (c) => {
  // get all on going jobs
  const userId = c.req.param("userid");
  const activeJobs = await myQueue.getActive();
  const waitingJobs = await myQueue.getWaiting();
  const completedJobs = await myQueue.getCompleted();

  let jobs: { status: string; key: string }[] = [];

  activeJobs.forEach((job) => {
    if (job.data.userId === userId) {
      jobs.push({
        status: "active",
        key: job.data.name,
      });
    }
  });

  waitingJobs.forEach((job) => {
    if (job.data.userId === userId) {
      jobs.push({
        status: "waiting",
        key: job.data.name,
      });
    }
  });

  completedJobs.forEach((job) => {
    if (job.data.userId === userId) {
      jobs.push({
        status: "completed",
        key: job.data.name,
      });
    }
  });

  return c.json(jobs);
});

app.post("/upload", async (c) => {
  const body = await c.req.parseBody();
  const zipFile = body.file as File;
  const userId = body.userId as string;
  const categoryStr = body.category as string;
  const zipBuffer = await zipFile.arrayBuffer();

  await redis.set(`category:${userId}`, categoryStr);

  yauzl.fromBuffer(
    Buffer.from(zipBuffer),
    { lazyEntries: true },
    (err, zipfile) => {
      zipfile.readEntry();
      zipfile.on("entry", function (entry) {
        if (/\/$/.test(entry.fileName)) {
          // Directory file names end with '/'.
          // Note that entries for directories themselves are optional.
          // An entry's fileName implicitly requires its parent directories to exist.
          zipfile.readEntry();
        } else {
          // file entry
          const chunks: Buffer[] = [];

          zipfile.openReadStream(entry, function (err, readStream) {
            if (err) {
              console.error(`Failed to read entry: ${err}`);
              zipfile.readEntry();
              return;
            }
            readStream.on("data", (chunk) => {
              chunks.push(chunk);
            });

            readStream.on("end", async () => {
              // Combine all chunks into a single buffer
              const fileBuffer = Buffer.concat(chunks);
              const fileName =
                entry.fileName.split("/").pop() || entry.fileName;

              try {
                // Store the buffer in Redis (using the file name as the key)
                if (fileName[0] !== ".") {
                  await myQueue.add(
                    "process_file",
                    {
                      name: fileName,
                      buffer: fileBuffer,
                      userId: userId,
                    },
                    { removeOnComplete: 20 }
                  );
                }
              } catch (redisErr) {
                console.error(`Failed to store file in Redis: ${redisErr}`);
              }

              zipfile.readEntry(); // Proceed to the next entry
            });
          });
        }
      });
    }
  );

  return c.text("Success");
});

const port = 8080;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
