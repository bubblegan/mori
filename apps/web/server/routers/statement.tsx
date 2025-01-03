import { prisma } from "@/utils/prisma";
import { Prisma, Statement } from "@prisma/client";
import { z } from "zod";
import { procedure, protectedProcedure, router } from "../trpc";

export type StatementAggregate = Statement & {
  total: number;
  startdate: Date;
  enddate: Date;
};

export const statementRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        years: z.number().array().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.auth.userId;

      const andDateSql = input.years
        ? Prisma.sql`AND EXTRACT(YEAR FROM "Statement"."date") IN (${Prisma.join(input.years)})`
        : Prisma.empty;

      const result = await prisma.$queryRaw<StatementAggregate[]>`
        Select "Statement"."id", "Statement"."date", "Statement"."createdAt", "Statement"."name", "Statement"."bank" , SUM("Expense"."amount") as total, MIN("Expense"."date") as startDate, MAX("Expense"."date") as endDate
        From "Statement"
        LEFT JOIN  "Expense" ON "Expense"."statementId" = "Statement"."id"
        LEFT JOIN "User" on "User"."id" = "Statement"."userId"
        WHERE "User"."id" = ${userId} ${andDateSql}
        Group By "Statement".id 
        ORDER BY "Statement"."date" DESC;

      `;

      if (!result) return [];

      return result;
    }),
  years: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    const result = await prisma.$queryRaw<{ years: string }[]>`
      SELECT DISTINCT EXTRACT(YEAR FROM "Statement"."date") as years
      FROM "Statement"
      LEFT JOIN "User" on "User"."id" = "Statement"."userId"
      WHERE "User"."id" = ${userId};
    `;

    if (!result) return [];

    return result;
  }),
  download: procedure.input(z.number().array()).query(async ({ input }) => {
    const result = await prisma.statement.findMany({
      select: {
        file: true,
      },
      where: {
        id: {
          in: input,
        },
      },
    });

    return result;
  }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        fileName: z.string().trim().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, fileName } = input;

      await prisma.statement.update({
        where: {
          id,
          userId: ctx.auth.userId,
        },
        data: {
          name: fileName,
        },
      });

      return { result: [] };
    }),
  delete: protectedProcedure.input(z.number().array()).mutation(async ({ input, ctx }) => {
    const result = await prisma.statement.deleteMany({
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
