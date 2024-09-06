import { prisma } from "@/utils/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const catergoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await prisma.category.findMany({
      where: {
        userId: ctx.auth.userId,
      },
    });
    return result;
  }),
  aggregate: protectedProcedure
    .input(
      z.object({
        statementIds: z.number().array().optional(),
        dateRange: z
          .object({
            start: z.string().datetime({ message: "Invalid datetime string! Must be ISO." }).nullable(),
            end: z.string().datetime({ message: "Invalid datetime string! Must be ISO." }).nullable(),
          })
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const conditions = [];

      conditions.push(Prisma.sql`"Expense"."userId" =  ${ctx.auth.userId}`);

      if (input.dateRange?.start && input.dateRange.end) {
        conditions.push(
          Prisma.sql`"Expense"."date" BETWEEN DATE(${input.dateRange?.start}) AND DATE(${input.dateRange?.end})`
        );
      }

      if (input.statementIds && input.statementIds.length > 0) {
        conditions.push(Prisma.sql`"AND Expense"."statementId" IN (${Prisma.join(input.statementIds)})`);
      }

      const result = await prisma.$queryRaw<{ title: string; amount: number; color: string }[]>`
        Select coalesce("Category"."title", 'uncategorised') as "title", coalesce("Category"."color", '#1e293b') as "color" ,SUM("Expense"."amount") as amount
        From "Expense"
        LEFT JOIN "Category" on "Category"."id" = "Expense"."categoryId" 
        WHERE ${Prisma.join(conditions, " AND ")}
        GROUP BY "title", "color"
      `;

      return result;
    }),
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1),
        keyword: z.array(z.string()),
        color: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.category.create({
        data: { ...input, userId: ctx.auth.userId },
      });

      return result;
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().trim().min(1),
        keyword: z.array(z.string()),
        color: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.category.update({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
        data: {
          title: input.title,
          keyword: input.keyword,
          color: input.color,
        },
      });

      return result;
    }),
});
