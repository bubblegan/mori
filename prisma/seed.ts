import { PrismaClient } from "@prisma/client";
import fs from "fs";

interface CategorySeed {
  categories: {
    title: string;
    keyword: string[];
  }[];
}

const prisma = new PrismaClient();
async function main() {
  // initial categories
  const jsonString = fs.readFileSync("./prisma/categoryList.json", "utf8");
  const data: CategorySeed = JSON.parse(jsonString);
  const categoriesWithUserId = data.categories.map((category) => {
    return {
      ...category,
      userId: 2,
    };
  });
  await prisma.category.createMany({
    data: categoriesWithUserId,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
