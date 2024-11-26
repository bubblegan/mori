import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/utils/prisma";
import { Request, Response } from "express";
import { seedCategories } from "../../../prisma/seed-category";
import { seedStatement } from "../../../prisma/seed-statement";

async function handler(req: NextApiRequest & Request, res: NextApiResponse & Response) {
  const { method } = req;

  // check header for x-cron-key
  const cronKey = req.headers["x-cron-key"];
  if (!cronKey || cronKey !== process.env.CRON_KEY) {
    // unauthorized
    return res.status(401).end("Unauthorized");
  }

  switch (method) {
    case "PATCH":
      // delete all
      await prisma.tagsOnExpenses.deleteMany();

      // delete all statement first
      await prisma.statement.deleteMany();

      // delete all expenses
      await prisma.expense.deleteMany();

      // delete all tags
      await prisma.tag.deleteMany();

      // delete all categories
      await prisma.category.deleteMany();

      const demoUserId = 5;

      await seedCategories(demoUserId);
      await seedStatement(demoUserId);

      res.status(200).end("Seeded");

      break;
    default:
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default handler;
