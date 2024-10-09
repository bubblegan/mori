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
  const categoryResult = await prisma.category.findMany({
    where: {
      userId: userId,
    },
  });

  switch (method) {
    case "GET":
      const response = await fetch(`http://localhost:8080/tasks/${userId}`, {
        method: "GET",
      });

      const data = (await response.json()) as Task[];
      const filterKeys = data?.map((task) => "done:" + task.key);
      const result = [];

      for (let i = 0; i < filterKeys.length; i++) {
        if (data[i].status === "completed") {
          const filterJob = await redis.get(filterKeys[i]);
          if (!!filterJob) {
            result.push(data[i]);
          }
        } else {
          result.push(data[i]);
        }
      }

      res.status(200).json(result);
      break;
    case "POST":
      const middleware = upload.single("statement");
      middleware(req, res, async () => {
        if (req.file?.mimetype === "application/zip") {
          const formData = new FormData();
          const buffer = fs.readFileSync(req.file?.path);
          const blob = new Blob([buffer]);
          formData.append("userId", userId.toString());
          formData.append("file", blob);
          formData.append("category", JSON.stringify(categoryResult));

          await fetch("http://localhost:8080/upload", {
            method: "POST",
            body: formData,
          });
        }
        res.status(200).end("success");
      });
      break;
    case "PATCH":
      const buf = await buffer(req);
      const rawBody = buf.toString("utf8");
      const keys = JSON.parse(rawBody);

      const jobKeys = keys?.id?.map((id: string) => "done:" + id);
      const jobs = await redis.mget(jobKeys);

      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        if (job) {
          const { completion, file } = JSON.parse(job);
          if (file && completion) {
            const [parsedStatment, parsedExpenses] = completionToParsedDate(completion, categoryResult);

            await prisma.statement.create({
              data: {
                name: keys?.id[i],
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

      // remove from queues
      await redis.del(jobKeys);
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
