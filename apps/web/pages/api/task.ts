import { NextApiRequest, NextApiResponse } from "next";
import { nextAuthOptions } from "@/utils/auth/nextAuthOption";
import { completionToParsedDate } from "@/utils/completion-to-parsed-data";
import { prisma } from "@/utils/prisma";
import { Request, Response } from "express";
import fs from "fs";
import Redis from "ioredis";
import multer from "multer";
import { getServerSession } from "next-auth";
import { Readable } from "stream";

const redis = new Redis();
const upload = multer({ dest: "/tmp" });

type Task = {
  status: string;
  key: string;
};

async function getBody(req: NextApiRequest & Request) {
  const buf = await buffer(req);
  const rawBody = buf.toString("utf8");
  const keys = rawBody ? JSON.parse(rawBody) : {};
  return keys;
}

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function handler(req: NextApiRequest & Request, res: NextApiResponse & Response) {
  const { method } = req;
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.id) return;
  const userId = session?.user?.id;

  if (!userId) {
    res.status(401).end(`Not Authenticated`);
  }

  const categoryResult = await prisma.category.findMany({
    where: {
      userId: userId,
    },
  });

  switch (method) {
    case "GET":
      const response = await fetch(`http://localhost:3001/tasks/${userId}`, {
        method: "GET",
      });

      if (response.ok) {
        const tasks = (await response.json()) as Task[];
        const filterKeys = tasks.map((task) => task.key);
        const result = [];

        for (let i = 0; i < filterKeys.length; i++) {
          if (tasks[i].status === "completed") {
            const filterJob = await redis.get(`done:${userId}:${filterKeys[i]}`);
            if (!!filterJob) {
              result.push(tasks[i]);
            }
          } else {
            result.push(tasks[i]);
          }
        }

        res.status(200).json(result);
      } else {
        res.status(500).json({ error: "something went wrong" });
      }

      break;
    case "POST":
      const middleware = upload.single("statement");
      middleware(req, res, async () => {
        if (req.file?.mimetype === "application/zip" || req.file?.mimetype === "application/pdf") {
          const formData = new FormData();
          const buffer = fs.readFileSync(req.file?.path);
          const blob = new Blob([buffer]);

          formData.append("userId", userId.toString());
          formData.append("file", blob);
          formData.append("fileName", req.file.filename);
          formData.append("category", JSON.stringify(categoryResult));

          const response = await fetch("http://localhost:3001/upload", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            res.status(200).end("success");
          }
        }
      });
      break;
    case "PATCH":
      const storeKeys = await getBody(req);
      const jobKeys = storeKeys?.id?.map((id: string) => `done:${userId}:${id}`) || [];
      const jobs = await redis.mget(jobKeys);

      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        if (job) {
          const { completion, file, name } = JSON.parse(job);
          if (file && completion) {
            const [parsedStatment, parsedExpenses] = completionToParsedDate(completion, categoryResult);

            await prisma.statement.create({
              data: {
                name: name,
                date: parsedStatment.statementDate || new Date(),
                bank: parsedStatment.bank || "No",
                file: Buffer.from(file),
                userId: session?.user?.id,
                Expense: {
                  createMany: {
                    data: parsedExpenses
                      .filter((expense) => {
                        return !isNaN(expense.amount);
                      })
                      .map((expense) => {
                        return {
                          description: expense.description,
                          amount: expense.amount,
                          date: expense.date,
                          ...(expense.categoryId ? { categoryId: expense.categoryId } : {}),
                          userId,
                        };
                      }),
                  },
                },
              },
            });
          }
        }
      }
      await redis.del(jobKeys);
      res.status(200).end("success");
      break;
    case "DELETE":
      const deleteKeysObj = await getBody(req);
      const deleteKeys = deleteKeysObj?.id?.map((id: string) => `done:${userId}:${id}`) || [];
      await redis.del(deleteKeys);
      res.status(200).end("success");
      break;
    default:
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
