import { hashPassword } from "@/utils/auth/hashPassword";
import { prisma } from "@/utils/prisma";
import fs from "fs";
import { z } from "zod";
import { procedure, router } from "../trpc";

type CategorySeed = {
  categories: {
    title: string;
    keyword: string[];
    color: string;
  }[];
};

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

      // Create category for user after create account
      const jsonString = fs.readFileSync("./prisma/categoryList.json", "utf8");
      const data: CategorySeed = JSON.parse(jsonString);
      const categoriesWithUserId = data.categories.map((category) => {
        return {
          ...category,
          userId: result.id,
        };
      });
      await prisma.category.createMany({
        data: categoriesWithUserId,
      });

      return {
        username: input.username,
        password: input.password,
      };
    }),
});
