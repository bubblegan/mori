import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// expense type
type ExpenseCSV = {
  description?: string;
  amount?: string;
  category?: string;
  date?: string;
};

export async function seedStatement(userId: number) {
  const results: ExpenseCSV[] = [];
  const filePath = path.join(process.cwd(), "prisma", "test-expense-data.csv");

  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileContent = fileBuffer.toString();

    const rows = fileContent.split("\n");
    const headers = rows[0].split(",");

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(",");
      const entry: ExpenseCSV = {};
      headers.forEach((header, index) => {
        entry[header.trim() as keyof ExpenseCSV] = values[index].trim();
      });
      results.push(entry);
    }

    const categories = await prisma.category.findMany({
      where: {
        userId,
      },
    });

    const categoriesMap: Record<string, number> = {};
    if (categories.length > 0) {
      categories.forEach((category) => {
        categoriesMap[category.title] = category.id;
      });
    }

    const createResult = await prisma.statement.create({
      data: {
        name: "test-expense-data",
        date: new Date("2024-10-31"),
        file: fileBuffer,
        bank: "test-bank",
        userId: userId,
        Expense: {
          createMany: {
            data: results.map((expense) => {
              return {
                description: expense.description || "",
                amount: Number(expense.amount),
                categoryId: expense.category ? categoriesMap[expense.category] : undefined,
                date: expense.date && new Date(expense.date),
                userId,
              };
            }),
          },
        },
      },
    });

    // Process the results here
    return createResult;
  } catch (error) {
    throw error;
  }
}
