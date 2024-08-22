import { NextApiRequest, NextApiResponse } from "next";
import { nextAuthOptions } from "@/utils/auth/nextAuthOption";
import { prisma } from "@/utils/prisma";
import { Expense } from "@prisma/client";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import { getServerSession } from "next-auth";
import { z } from "zod";

const upload = multer({ dest: "/tmp" });
dayjs.extend(customParseFormat);

const statmentPayloadSchema = z.object({
  bank: z.string(),
  date: z.string().datetime({ message: "Invalid datetime string! Must be ISO." }),
  expenses: z.array(
    z.object({
      categoryId: z.number().optional(),
      description: z.string().trim().min(1),
      amount: z.number().multipleOf(0.01),
    })
  ),
});

export type CreateExpense = Pick<Expense, "description" | "date"> & {
  tempId?: number;
  categoryName?: string;
  categoryId?: number;
  amount: number;
};

export type BankType = "DBS" | "CITI" | "CIMB" | "UOB" | "HSBC" | undefined;

export type ParsedResult = {
  expenses: CreateExpense[];
  statementDate: Date;
  bank: BankType;
};

export type ParsedResponse = {
  message: string;
  fileId: number;
  fileName: string;
  statementDate: Date;
  bank: string;
  totalAmount: string;
  expenses: CreateExpense[];
};

async function handler(req: NextApiRequest & Request, res: NextApiResponse & Response) {
  const { method } = req;

  switch (method) {
    case "POST":
      const middleware = upload.single("statement");
      middleware(req, res, async () => {
        const session = await getServerSession(req, res, nextAuthOptions);
        if (!session?.user?.id) return;

        const userId = session?.user?.id;

        if (req.file?.mimetype === "application/pdf") {
          try {
            const fileBuffer = fs.readFileSync(req.file?.path);
            const fileName = req.file?.originalname;
            const { payload } = req.body;

            const statementPayload: z.infer<typeof statmentPayloadSchema> = JSON.parse(payload);
            statmentPayloadSchema.parse(statementPayload);

            const result = await prisma.statement.create({
              data: {
                name: fileName,
                date: new Date(statementPayload.date),
                bank: statementPayload.bank || "No",
                file: fileBuffer,
                userId: session?.user?.id,
                Expense: {
                  createMany: {
                    data: statementPayload.expenses.map((expense) => {
                      return { ...expense, userId };
                    }),
                  },
                },
              },
            });

            console.log(result);

            res.status(200).json({
              message: "Parse Successfully",
            });
          } catch (error) {
            res.status(500).json({ error, message: "Upload Fail" });
          }
        }
      });
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
