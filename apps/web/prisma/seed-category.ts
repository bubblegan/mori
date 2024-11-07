import { PrismaClient } from "@prisma/client";

type CategorySeed = {
  categories: {
    title: string;
    keyword: string[];
    color: string;
  }[];
};

const data: CategorySeed = {
  categories: [
    {
      title: "transport",
      keyword: ["bus", "mrt", "grab"],
      color: "#1E3A5F",
    },
    {
      title: "food",
      keyword: [],
      color: "#B0BEC5",
    },
    {
      title: "grocery",
      keyword: ["ntuc", "sheng shiong"],
      color: "#00695C",
    },
    {
      title: "utilities",
      keyword: [],
      color: "#8C9E36",
    },
    {
      title: "entertainment",
      keyword: [],
      color: "#7E57C2",
    },
    {
      title: "insurance",
      keyword: [],
      color: "#4DB6AC",
    },
    {
      title: "subscription",
      keyword: [],
      color: "#D32F2F",
    },
    {
      title: "shopping",
      keyword: [],
      color: "#303F9F",
    },
    {
      title: "travel",
      keyword: [],
      color: "#F48FB1",
    },
    {
      title: "health",
      keyword: [],
      color: "#FFB74D",
    },
    {
      title: "other",
      keyword: [],
      color: "#0288D1",
    },
  ],
};

const prisma = new PrismaClient();

export async function seedCategories(userId: number) {
  const categoriesWithUserId = data.categories.map((category) => {
    return {
      ...category,
      userId,
    };
  });
  const result = await prisma.category.createMany({
    data: categoriesWithUserId,
  });

  return result;
}
