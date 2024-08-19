import { prisma } from "@/utils/prisma";
import { z } from "zod";
import openAi from "../../server/ai/openAi";
import generateCategorisePrompt, { CategorizableExpense } from "../ai/generateCategorisePrompt";
import { protectedProcedure, router } from "../trpc";

interface MonthlyAmount {
  sum: number;
  month: Date;
}
interface CategoryAmount {
  id?: number;
  sum: string;
  title?: string;
  color?: string;
}

export const expenseRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        statementIds: z.number().array().optional(),
        categoryIds: z.number().array().optional(),
        keyword: z.string().optional(),
        dateRange: z
          .object({
            start: z.string().datetime({ message: "Invalid datetime string! Must be ISO." }).nullable(),
            end: z.string().datetime({ message: "Invalid datetime string! Must be ISO." }).nullable(),
          })
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const result = await prisma.expense.findMany({
        // skip: page * 15,
        take: 100,
        where: {
          ...(input.statementIds && input.statementIds?.length > 0
            ? { statementId: { in: input.statementIds } }
            : {}),
          ...(input.categoryIds && input.categoryIds?.length > 0
            ? {
                categoryId: { in: input.categoryIds },
              }
            : {}),
          ...(input.dateRange?.start && input.dateRange?.end
            ? {
                date: {
                  gte: input.dateRange.start,
                  lte: input.dateRange.end,
                },
              }
            : {}),
          ...(input.keyword
            ? {
                description: {
                  contains: input.keyword,
                  mode: "insensitive",
                },
              }
            : {}),
          userId: ctx.auth.userId,
        },
        include: {
          Category: true,
          Statement: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { date: "desc" },
      });

      return {
        result,
      };
    }),
  categorise: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        statementIds: z.number().array().optional(),
        categoryIds: z.number().array().optional(),
        keyword: z.string().optional(),
        dateRange: z
          .object({
            start: z.string().datetime({ message: "Invalid datetime string! Must be ISO." }).nullable(),
            end: z.string().datetime({ message: "Invalid datetime string! Must be ISO." }).nullable(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.expense.findMany({
        // skip: page * 15,
        take: 100,
        where: {
          ...(input.statementIds && input.statementIds?.length > 0
            ? { statementId: { in: input.statementIds } }
            : {}),
          ...(input.categoryIds && input.categoryIds?.length > 0
            ? {
                categoryId: { in: input.categoryIds },
              }
            : {}),
          ...(input.dateRange?.start && input.dateRange?.end
            ? {
                date: {
                  gte: input.dateRange.start,
                  lte: input.dateRange.end,
                },
              }
            : {}),
          ...(input.keyword
            ? {
                description: {
                  contains: input.keyword,
                  mode: "insensitive",
                },
              }
            : {}),
          userId: ctx.auth.userId,
        },
        include: {
          Category: true,
          Statement: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { date: "desc" },
      });

      const categorizableExpense: CategorizableExpense[] = result.map((expense) => {
        return {
          description: expense.description,
          tempId: expense.id,
          categoryId: expense.categoryId,
        };
      });

      const categorisePrompt = await generateCategorisePrompt(categorizableExpense, {
        skipCategorised: false,
      });
      const categoriseRes = await openAi(categorisePrompt);
      const categoriseContent = categoriseRes.choices[0].message.content;

      const sqlIds: string[] = [];
      const sqlUpdatedExpense: string[] = [];
      categoriseContent?.split("\n").forEach((line) => {
        const data = line.split(",");
        sqlIds.push(data[0]);
        sqlUpdatedExpense.push(`WHEN id = ${data[0]} THEN ${data[3]}`);
      });

      const bulkUpdateCategoryResult = await prisma.$executeRawUnsafe<CategoryAmount[]>(`
        UPDATE "Expense"
        SET 
            "categoryId" = CASE 
                ${sqlUpdatedExpense.join(" ")} 
            END
        WHERE "Expense"."id" IN (${sqlIds.join(", ")});
      `);

      return {
        bulkUpdateCategoryResult,
      };
    }),
  aggregateByYear: protectedProcedure
    .input(
      z.object({
        year: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { year } = input;

      const result = await prisma.$queryRaw<MonthlyAmount[]>`
        Select date_trunc('month', "Expense"."date") AS month, SUM("Expense"."amount") 
        From "Expense" 
        WHERE date_part('year', "Expense"."date") = ${year} AND "Expense"."userId" = ${ctx.auth.userId}
        GROUP BY month
      `;

      return result;
    }),
  distinctYear: protectedProcedure.query(async () => {
    const result = await prisma.$queryRaw<{ year: number }[]>`
       SELECT DISTINCT EXTRACT(YEAR FROM "Expense"."date") AS year
       FROM "Expense" ORDER BY year DESC;
    `;

    return result;
  }),
  aggregateByCategory: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime({ message: "Invalid datetime string! Must be ISO." }).nullable(),
        endDate: z.string().datetime({ message: "Invalid datetime string! Must be ISO." }).nullable(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { startDate, endDate } = input;

      if (!startDate || !endDate) {
        return [];
      }

      const result = await prisma.$queryRaw<CategoryAmount[]>`
          Select "Expense"."categoryId" id, SUM("Expense"."amount"), "Category".title, "Category".color
          From "Expense"
          LEFT JOIN 
            "Category"
          ON 
            "Expense"."categoryId" = "Category"."id"
          WHERE "Expense"."date" BETWEEN TO_TIMESTAMP(${startDate},'YYYY-MM-DD') AND TO_TIMESTAMP(${endDate},'YYYY-MM-DD') AND "Expense"."userId" = ${ctx.auth.userId}
          GROUP BY "Expense"."categoryId", "Category"."title", "Category".color
      `;

      return result;
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        description: z.string().trim().min(1),
        categoryId: z.number(),
        amount: z.number().multipleOf(0.01),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { description, categoryId, amount, note } = input;
      const result = await prisma.expense.update({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
        data: {
          description,
          categoryId,
          amount,
          note,
        },
      });

      return result;
    }),
  create: protectedProcedure
    .input(
      z.object({
        description: z.string().trim().min(1),
        categoryId: z.number(),
        amount: z.number().multipleOf(0.01),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { description, categoryId, amount, note } = input;

      const result = await prisma.expense.create({
        data: { description, categoryId, amount, note, userId: ctx.auth.userId },
      });

      return result;
    }),
});
