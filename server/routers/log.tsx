import { prisma } from "@/utils/prisma";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const logRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        from: z.string().datetime(),
      })
    )
    .query(async ({ input, ctx }) => {
      const fromDate = input.from;
      const result = prisma.eventLog.findMany({
        where: {
          userId: ctx.auth.userId,
          createdAt: {
            gte: fromDate,
          },
        },
      });

      return result;
    }),
});
