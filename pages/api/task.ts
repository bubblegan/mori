import { NextApiRequest, NextApiResponse } from "next";
import { nextAuthOptions } from "@/utils/auth/nextAuthOption";
import { completionToParsedDate } from "@/utils/completion-to-parsed-data";
import { prisma } from "@/utils/prisma";
import { Request, Response } from "express";
import fs from "fs";
import Redis from "ioredis";
import multer from "multer";
import { getServerSession } from "next-auth";

const redis = new Redis();
const upload = multer({ dest: "/tmp" });

async function handler(req: NextApiRequest & Request, res: NextApiResponse & Response) {
  const { method } = req;
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.id) return;
  const userId = session?.user?.id;

  switch (method) {
    case "GET":
      const response = await fetch(`http://localhost:8080/tasks/${userId}`, {
        method: "GET",
      });
      const data = await response.json();
      res.status(200).json(data);
      break;
    case "POST":
      const middleware = upload.single("statement");
      middleware(req, res, async () => {
        if (req.file?.mimetype === "application/zip") {
          const formData = new FormData();
          let buffer = fs.readFileSync(req.file?.path);
          let blob = new Blob([buffer]);
          formData.append("userId", userId.toString());
          formData.append("file", blob);

          await fetch("http://localhost:8080/upload", {
            method: "POST",
            body: formData,
          });
        }
        res.status(200).end("success");
      });
      break;
    case "PATCH":
      // query redis
      const keys = req.body?.id || [];

      const jobKeys = keys.map((id: string) => "done:" + id);
      const jobs = await redis.mget(jobKeys);

      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        if (job) {
          const { completion, file } = JSON.parse(job);
          if (file && completion) {
            const [parsedStatment, parsedExpenses] = completionToParsedDate(completion);

            await prisma.statement.create({
              data: {
                name: keys[i],
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
      await redis.del([jobKeys]);

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
