import crypto from "crypto";
import dotenv from "dotenv";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import NodeCache from "node-cache";
import OpenAI from "openai";
import { fileTypeFromBuffer } from "file-type";
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { fromBuffer } from "pdf2pic";
import { createWorker } from "tesseract.js";
import yauzl from "yauzl";

import { calculateTokenPricing } from "./calculate-token-pricing.js";
import { generateParsingPrompt } from "./generate-parsing-prompt.js";
import { trimPdfText } from "./trim-pdf-text.js";

dotenv.config({ path: "../../.env" });

type StatementTask = {
  id: string;
  name: string;
  buffer: Buffer;
  userId: string;
};

type CompletedTask = {
  state: string;
  completion: string;
  file: Buffer;
  name: string;
  userId: string;
  completedAt: Date;
  completionTokens: number;
  promptTokens: number;
  pricing: number;
};

const taskCache = new NodeCache();
const app = new Hono();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware to validate x-api-key
app.use("*", async (c, next) => {
  const apiKey = c.req.header("x-api-key");
  if (apiKey !== process.env.NEXT_BG_TASK_API_KEY) {
    return c.text("Unauthorized", 401);
  }
  await next();
});

async function pdfProcessWorker(task: StatementTask): Promise<void> {
  try {
    let pdfText = "";
    taskCache.set<StatementTask>("active-task", task);
    const fileBuffer = Buffer.from(task.buffer);
    const bufferResponses = await fromBuffer(fileBuffer, {
      density: 200,
      format: "png",
      width: 2000,
      height: 2000,
    }).bulk(-1, { responseType: "buffer" });

    const categoryStr = taskCache.get<any>(`category:${task.userId}`);
    const category = JSON.parse(categoryStr);

    console.log(task.name, ": start OCR");

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

    console.log(task.name, ": start prompting");

    // prompt open AI
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
    });

    let promptValue = chatCompletion.choices[0].message.content || "";
    let fileValue = task.buffer;

    const completionTokens = chatCompletion.usage?.completion_tokens || 0;
    const promptTokens = chatCompletion.usage?.prompt_tokens || 0;

    const value: CompletedTask = {
      state: "completed",
      completion: promptValue,
      file: fileValue,
      name: task.name,
      userId: task.userId,
      completedAt: new Date(),
      completionTokens,
      promptTokens,
      pricing:
        calculateTokenPricing(completionTokens, promptTokens, "gpt-4o") || 0,
    };

    taskCache.set<CompletedTask>(`done:${task.userId}:${task.id}`, value);

    const completedTask =
      taskCache.get<string[]>(`completed-task:${task.userId}`) || [];
    completedTask?.push(task.id);

    taskCache.set<string[]>(`completed-task:${task.userId}`, completedTask);

    taskCache.del("active-task");
  } catch (e) {
    console.log(e);
  }
}

const taskQueue: queueAsPromised<StatementTask> = fastq.promise(
  pdfProcessWorker,
  1
);

app.use("/*", cors());

app.get("/tasks/:userid", async (c) => {
  const userId = c.req.param("userid");

  const waitingTasks = taskQueue.getQueue();
  const completedTasks =
    taskCache.get<string[]>(`completed-task:${userId}`) || [];
  const activeTask = taskCache.get<StatementTask>(`active-task`);

  let tasks: {
    status: string;
    key: string;
    title: string;
    completedAt?: Date;
    promptTokens?: number;
    completionTokens?: number;
    pricing?: number;
  }[] = [];

  if (activeTask && activeTask.userId === userId) {
    tasks.push({
      status: "active",
      title: activeTask.name,
      key: activeTask.id || "",
    });
  }

  waitingTasks.forEach((task) => {
    if (task.userId === userId) {
      tasks.push({
        status: "waiting",
        title: task.name,
        key: task.id || "",
      });
    }
  });

  for (let i = 0; i < completedTasks.length; i++) {
    const completed = taskCache.get<CompletedTask>(
      `done:${userId}:${completedTasks[i]}`
    );
    if (completed) {
      tasks.push({
        status: "completed",
        title: completed.name,
        key: completedTasks[i] || "",
        completedAt: completed.completedAt,
        promptTokens: completed.promptTokens,
        completionTokens: completed.completionTokens,
        pricing: completed.pricing,
      });
    }
  }

  return c.json(tasks);
});

app.get("/tasks/:userid/done", (c) => {
  const userId = c.req.param("userid");
  const taskIds = c.req.query("ids")?.split(",") || [];

  const taskKey = taskIds.map((id: string) => `done:${userId}:${id}`) || [];
  const completedTasks = taskCache.mget(taskKey);
  const completedTasksArray = Object.values(completedTasks);

  return c.json(completedTasksArray);
});

app.delete("/tasks/:userid/done", (c) => {
  const userId = c.req.param("userid");
  const taskIds = c.req.query("ids")?.split(",") || [];

  const taskKey = taskIds.map((id: string) => `done:${userId}:${id}`) || [];

  const deleteKey = taskCache.del(taskKey);

  // delete fromm taskCache as well.
  const completedTask =
    taskCache.get<string[]>(`completed-task:${userId}`) || [];

  const newCompletedTask = completedTask.filter(
    (task) => !taskIds.includes(task)
  );

  taskCache.set<string[]>(`completed-task:${userId}`, newCompletedTask);

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

  taskCache.set(`category:${userId}`, categoryStr);

  if (fileType?.mime === "application/pdf") {
    taskQueue.push({
      id: crypto.randomUUID(),
      name: fileName,
      buffer: Buffer.from(fileBuffer),
      userId: userId,
    });
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
                  if (fileName[0] !== ".") {
                    taskQueue.push({
                      id: crypto.randomUUID(),
                      name: fileName,
                      buffer: Buffer.from(fileBuffer),
                      userId: userId,
                    });
                  }
                } catch (queueError) {
                  console.error(`Failed to push file to queue: ${queueError}`);
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
