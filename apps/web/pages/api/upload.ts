import { NextApiRequest, NextApiResponse } from "next";
import { Expense } from "@prisma/client";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Request, Response } from "express";

dayjs.extend(customParseFormat);

export type CreateExpense = Pick<Expense, "description" | "date"> & {
  tempId?: number;
  categoryTitle?: string;
  categoryId?: number;
  amount: number;
};

export type ParsedResult = {
  expenses: CreateExpense[];
  statementDate: Date;
  bank: string;
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
