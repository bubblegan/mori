import { useState } from "react";
import { fetchCompletion } from "../ai/fetch-completion";
import { generateCategorisePrompt } from "../ai/generate-categorise-prompt";
import { formatCategoryIdByName } from "../format-categoryId-by-name";
import { trpc } from "../trpc";

type CategorisableExpense = {
  description: string;
  id: number;
};

type CategorisedExpense = {
  categoryId: number;
  categoryTitle: string;
  id: number;
};

export function useCategoriseExpense() {
  const [isFetching, setIsFetching] = useState(false);
  const categories = trpc.category.list.useQuery();

  const handleCategorise = async (expenses: CategorisableExpense[]): Promise<CategorisedExpense[]> => {
    setIsFetching(true);
    let categoryIdByName: Record<string, number> = formatCategoryIdByName(categories.data || []);
    const categorisePrompt = generateCategorisePrompt(expenses, categories.data || []);
    const response: { completion: string } = await fetchCompletion(categorisePrompt);
    const categorisedExpense: CategorisedExpense[] = [];
    response?.completion.split("\n").forEach((line: string) => {
      const data = line.split(",");
      if (data.length === 3) {
        categorisedExpense.push({
          id: Number(data[0]),
          categoryTitle: data[1],
          categoryId: categoryIdByName[data[2].trim().toLowerCase()],
        });
      }
    });
    setIsFetching(false);
    return categorisedExpense;
  };

  return { handleCategorise, isFetching };
}
