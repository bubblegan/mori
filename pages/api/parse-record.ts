import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/utils/prisma";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PATCH") {
    const expenses = await prisma.expense.findMany();
    const categories = await prisma.category.findMany();

    expenses.forEach((expense) => {
      categories.forEach((category) => {
        category.keyword?.forEach(async (keyword) => {
          if (expense.description.toLowerCase().includes(keyword)) {
            expense.categoryId = category.id;
            await prisma.expense.update({
              where: {
                id: expense.id,
              },
              data: {
                categoryId: expense.categoryId,
              },
            });
          }
        });
      });
    });

    res.status(200).end("parse successful");
  }
}

export default handler;
