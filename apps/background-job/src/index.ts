import { fromBuffer } from "pdf2pic";
import { createWorker } from "tesseract.js";
import { serve } from "@hono/node-server";
import Redis from "ioredis";
import { cors } from "hono/cors";
import { Job, Queue, Worker } from "bullmq";
import yauzl from "yauzl";
import { Hono } from "hono";
import OpenAI from "openai";
import { fileTypeFromBuffer } from "file-type";
import { generateParsingPrompt } from "./generate-parsing-prompt.js";
import { trimPdfText } from "./trim-pdf-text.js";

import dotenv from "dotenv";

dotenv.config();

type StatementJob = {
  name: string;
  buffer: Buffer;
  userId: string;
};

const redis = new Redis({
  host: process.env.REDIS_HOST, // The Redis service name defined in Docker Compose
  port: 6379,
});

const app = new Hono();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a new connection in every instance
const statementQueue = new Queue<StatementJob>("process_file", {
  connection: {
    host: process.env.REDIS_HOST,
    port: 6379,
  },
});

const myWorker = new Worker<StatementJob>(
  "process_file",
  async (job) => {
    let pdfText = "";
    const fileBuffer = Buffer.from(job.data.buffer);
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

    // trim and make the prompt shorter
    pdfText = trimPdfText(pdfText);

    // generate prompt
    const prompt = generateParsingPrompt(pdfText, category);

    console.log(job.data.name, ": start prompting");

    // prompt open AI
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
    });
    let promptValue = chatCompletion.choices[0].message.content || "";
    let fileValue = job.data.buffer;

    const value = {
      completion: promptValue,
      file: fileValue,
      name: job.data.name,
      userId: job.data.userId,
    };

    await redis.set(`done:${job.data.userId}:${job.id}`, JSON.stringify(value));
    return promptValue;
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
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
  const activeJobs = await statementQueue.getActive();
  const waitingJobs = await statementQueue.getWaiting();
  const completedJobs = await statementQueue.getCompleted();

  let jobs: { status: string; key: string; title: string }[] = [];

  activeJobs.forEach((job) => {
    if (job.data.userId === userId) {
      jobs.push({
        status: "active",
        title: job.data.name,
        key: job.id || "",
      });
    }
  });

  waitingJobs.forEach((job) => {
    if (job.data.userId === userId) {
      jobs.push({
        status: "waiting",
        title: job.data.name,
        key: job.id || "",
      });
    }
  });

  completedJobs.forEach((job) => {
    if (job.data.userId === userId) {
      jobs.push({
        status: "completed",
        title: job.data.name,
        key: job.id || "",
      });
    }
  });

  return c.json(jobs);
});

app.post("/upload", async (c) => {
  const body = await c.req.parseBody();

  const file = body.file as File;
  const userId = body.userId as string;
  const categoryStr = body.category as string;
  const fileName = body.fileName as string;

  const fileBuffer = await file.arrayBuffer();
  const fileType = await fileTypeFromBuffer(fileBuffer);

  await redis.set(`category:${userId}`, categoryStr);

  if (fileType?.mime === "application/pdf") {
    await statementQueue.add(
      "process_file",
      {
        name: fileName,
        buffer: Buffer.from(fileBuffer),
        userId: userId,
      },
      { removeOnComplete: 30 }
    );
  }

  if (fileType?.mime === "application/zip") {
    yauzl.fromBuffer(
      Buffer.from(fileBuffer),
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
                    await statementQueue.add(
                      "process_file",
                      {
                        name: fileName,
                        buffer: fileBuffer,
                        userId: userId,
                      },
                      { removeOnComplete: 30 }
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
  }

  return c.text("Success");
});

const port = 3001;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
