import { fromBuffer } from "pdf2pic";
import { createWorker } from "tesseract.js";
import { serve } from "@hono/node-server";
import Redis from "ioredis";
import { cors } from "hono/cors";
import { Queue, Worker } from "bullmq";
import yauzl from "yauzl";
import { Hono } from "hono";
import OpenAI from "openai";
import { fileTypeFromBuffer } from "file-type";
import { generateParsingPrompt } from "./generate-parsing-prompt.js";
import { trimPdfText } from "./trim-pdf-text.js";

import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

type StatementTask = {
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
const statementQueue = new Queue<StatementTask>("process_file", {
  connection: {
    host: process.env.REDIS_HOST,
    port: 6379,
  },
});

const myWorker = new Worker<StatementTask>(
  "process_file",
  async (task) => {
    let pdfText = "";
    const fileBuffer = Buffer.from(task.data.buffer);
    const bufferResponses = await fromBuffer(fileBuffer, {
      density: 200,
      format: "png",
      width: 2000,
      height: 2000,
    }).bulk(-1, { responseType: "buffer" });

    const categoryStr = await redis.get(`category:${task.data.userId}`);
    const category = JSON.parse(categoryStr || "");

    console.log(task.data.name, ": start OCR");

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

    console.log(task.data.name, ": start prompting");

    // prompt open AI
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
    });
    let promptValue = chatCompletion.choices[0].message.content || "";
    let fileValue = task.data.buffer;

    const value = {
      state: "completed",
      completion: promptValue,
      file: fileValue,
      name: task.data.name,
      userId: task.data.userId,
      completedAt: new Date(),
    };

    await redis.set(
      `done:${task.data.userId}:${task.id}`,
      JSON.stringify(value)
    );
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
  const userId = c.req.param("userid");
  const activeTasks = await statementQueue.getActive();
  const waitingTasks = await statementQueue.getWaiting();
  const completedTasks = await statementQueue.getCompleted();

  let tasks: { status: string; key: string; title: string }[] = [];

  activeTasks.forEach((task) => {
    if (task.data.userId === userId) {
      tasks.push({
        status: "active",
        title: task.data.name,
        key: task.id || "",
      });
    }
  });

  waitingTasks.forEach((task) => {
    if (task.data.userId === userId) {
      tasks.push({
        status: "waiting",
        title: task.data.name,
        key: task.id || "",
      });
    }
  });

  for (let i = 0; i < completedTasks.length; i++) {
    if (completedTasks[i].data.userId === userId) {
      const filterTask = await redis.get(
        `done:${userId}:${completedTasks[i].id}`
      );
      if (filterTask) {
        tasks.push({
          status: "completed",
          title: completedTasks[i].data.name,
          key: completedTasks[i].id || "",
        });
      }
    }
  }

  return c.json(tasks);
});

app.get("/tasks/:userid/done", async (c) => {
  const userId = c.req.param("userid");
  const taskIds = c.req.query("ids")?.split(",") || [];

  const taskKey = taskIds.map((id: string) => `done:${userId}:${id}`) || [];
  const completedTasks = await redis.mget(taskKey);
  return c.json(completedTasks);
});

app.delete("/tasks/:userid/done", async (c) => {
  const userId = c.req.param("userid");
  const taskIds = c.req.query("ids")?.split(",") || [];

  const taskKey = taskIds.map((id: string) => `done:${userId}:${id}`) || [];
  const deleteKey = await redis.del(taskKey);
  return c.json(deleteKey);
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
