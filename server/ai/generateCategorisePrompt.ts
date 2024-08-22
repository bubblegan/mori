import { prisma } from "@/utils/prisma";

export type CategorizableExpense = {
  description: string;
  tempId: number | undefined;
  categoryId: number | null;
};

async function generateCategorisePrompt(
  expenses: CategorizableExpense[],
  options: { skipCategorised?: boolean }
) {
  const { skipCategorised = true } = options;

  const categories = await prisma.category.findMany();
  const categoriesLine = categories.map((cat) => {
    return cat.title;
  });
  const categoriesIdLine = categories.map((cat) => {
    return cat.id;
  });

  const promptCat = categoriesLine.join(",");
  const promptId = categoriesIdLine.join(",");
  let prompt = "";

  // base on the current categories
  prompt += `Given these categories and its category: ${promptCat} . And its corresponding id: ${promptId}`;

  // provide list of categories
  prompt +=
    " Help me categorize the following expenses with the format of {expenseId},{expense} into the format of {expenseId},{expense},{category},{category id} . Without the line numbering.  \n";

  expenses.forEach((expense) => {
    if (skipCategorised) {
      if (!expense.categoryId) {
        prompt += expense.tempId + "," + expense.description + "\n";
      }
    } else {
      prompt += expense.tempId + "," + expense.description + "\n";
    }
  });

  return prompt;
}

export default generateCategorisePrompt;
