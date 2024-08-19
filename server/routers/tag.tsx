import { prisma } from "@/utils/prisma";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const tagRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await prisma.tag.findMany({
      where: {
        userId: ctx.auth.userId,
      },
    });
    return {
      result,
    };
  }),
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.tag.create({
        data: { ...input, userId: ctx.auth.userId },
      });

      return result;
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().trim().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.tag.update({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
        data: {
          title: input.title,
        },
      });

      return result;
    }),
});
