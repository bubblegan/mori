import { prisma } from "@/utils/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { expenseSchema, expensesSchema } from "../../schema";
import { protectedProcedure, router } from "../trpc";

type CategoryAmount = {
  id?: number;
  sum: string;
  title?: string;
  color?: string;
};

export const expenseRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        per: z.number(),
        statementIds: z.number().array().optional(),
        categoryIds: z.number().array().optional(),
        tagIds: z.number().array().optional(),
        keyword: z.string().optional(),
        uncategorised: z.boolean().optional(),
        order: z
          .object({ by: z.string(), direction: z.union([z.literal("asc"), z.literal("desc")]) })
          .optional(),
        dateRange: z
          .object({
            start: z.date().nullable(),
            end: z.date().nullable(),
          })
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const whereQuery: Prisma.ExpenseFindManyArgs = {
        where: {
          ...(input.statementIds && input.statementIds?.length > 0
            ? { statementId: { in: input.statementIds } }
            : {}),
          ...(input.categoryIds && input.categoryIds?.length > 0
            ? {
                categoryId: { in: input.categoryIds },
              }
            : {}),
          ...(input.tagIds && input.tagIds?.length > 0
            ? {
                tags: {
                  some: {
                    tagId: {
                      in: input.tagIds,
                    },
                  },
                },
              }
            : {}),
          ...(input.uncategorised
            ? {
                categoryId: null,
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
      };

      const orderBy = input.order?.by || "date";
      const orderDirection = input.order?.direction || "desc";

      const result = await prisma.expense.findMany({
        skip: input.page ? (input.page - 1) * input.per : 0,
        take: input.per,
        where: whereQuery.where,
        include: {
          Category: true,
          Statement: {
            select: {
              name: true,
            },
          },
          tags: true,
        },
        orderBy: { [orderBy]: orderDirection },
      });

      const aggregateResult = await prisma.expense.aggregate({
        where: whereQuery.where,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      return { result, aggregateResult };
    }),
  categorise: protectedProcedure
    .input(
      z.array(
        z.object({
          expenseId: z.number(),
          categoryId: z.number(),
        })
      )
    )
    .mutation(async ({ input }) => {
      const sqlIds: string[] = [];
      const sqlUpdatedExpense: string[] = [];

      input.forEach((expense) => {
        const expenseId = expense.expenseId.toString();
        const categoryId = expense.categoryId.toString();

        sqlIds.push(expenseId);
        sqlUpdatedExpense.push(`WHEN id = ${expenseId} THEN ${categoryId}`);
      });

      const bulkUpdateCategoryResult = await prisma.$executeRawUnsafe<CategoryAmount[]>(`
        UPDATE "Expense"
        SET 
            "categoryId" = CASE 
                ${sqlUpdatedExpense.join(" ")} 
            END
        WHERE "Expense"."id" IN (${sqlIds.join(", ")});
      `);

      return bulkUpdateCategoryResult;
    }),
  tagMany: protectedProcedure
    .input(
      z.array(
        z.object({
          expenseId: z.number(),
          tagIds: z.number().array(),
        })
      )
    )
    .mutation(async ({ input, ctx }) => {
      const promises = input.map((line) => {
        return prisma.expense.update({
          where: {
            id: line.expenseId,
            userId: ctx.auth.userId,
          },
          data: {
            tags: {
              deleteMany: {},
              create: line.tagIds?.map((tag) => {
                return {
                  assignedAt: new Date(),
                  tag: {
                    connect: {
                      id: tag,
                    },
                  },
                };
              }),
            },
          },
        });
      });

      const result = await Promise.all(promises);

      return result;
    }),
  aggregateByMonth: protectedProcedure
    .input(
      z.object({
        start: z.date().nullable(),
        end: z.date().nullable(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { start, end } = input;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const result = await prisma.$queryRaw<{ title: string; amount: number; count: bigint }[]>`
        Select date_trunc('month', "Expense"."date" at time zone 'UTC' at time zone ${timeZone}) AS "title", SUM("Expense"."amount") AS "amount", COUNT("Expense"."amount") as count
        From "Expense" 
        WHERE "Expense"."date" BETWEEN ${start} AND ${end} AND "Expense"."userId" = ${ctx.auth.userId}
        GROUP BY "title"
        ORDER BY "title" ASC
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
  update: protectedProcedure
    .input(expenseSchema.extend({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { description, categoryId, amount, note, date, tags } = input;
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
          date,
          tags: {
            deleteMany: {},
            create: tags?.map((tag) => {
              return {
                assignedAt: new Date(),
                tag: {
                  connect: {
                    id: tag,
                  },
                },
              };
            }),
          },
        },
      });

      return result;
    }),
  create: protectedProcedure.input(expenseSchema).mutation(async ({ input, ctx }) => {
    const { description, categoryId, amount, note, date, tags } = input;
    const result = await prisma.expense.create({
      data: {
        description,
        categoryId,
        amount,
        note,
        date,
        userId: ctx.auth.userId,
        tags: {
          create: tags?.map((tag) => {
            return {
              assignedAt: new Date(),
              tag: {
                connect: {
                  id: tag,
                },
              },
            };
          }),
        },
      },
    });

    return result;
  }),
  createMany: protectedProcedure.input(expensesSchema).mutation(async ({ input, ctx }) => {
    const expenses = input.map((expense) => {
      const { description, categoryId, amount, note, date } = expense;
      return {
        description,
        categoryId,
        amount,
        note,
        date,
        userId: ctx.auth.userId,
      };
    });

    const result = await prisma.expense.createMany({
      data: expenses,
    });

    return result;
  }),
  delete: protectedProcedure.input(z.number().array()).mutation(async ({ input, ctx }) => {
    const result = await prisma.expense.deleteMany({
      where: {
        id: {
          in: input,
        },
        userId: ctx.auth.userId,
      },
    });
    return result;
  }),
});
