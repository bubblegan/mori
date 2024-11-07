import { hashPassword } from "@/utils/auth/hashPassword";
import { prisma } from "@/utils/prisma";
import { z } from "zod";
import { seedCategories } from "../../prisma/seed-category";
import { procedure, router } from "../trpc";

export const authRouter = router({
  create: procedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const passwordHash = await hashPassword(input.password);

      const result = await prisma.user.create({
        data: {
          username: input.username,
          password: passwordHash,
        },
      });

      const userId = result.id;

      await seedCategories(userId);

      return {
        username: input.username,
        password: input.password,
      };
    }),
});
