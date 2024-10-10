import { useToast } from "@/components/ui/use-toast";
import { useCompletion } from "ai/react";
import currency from "currency.js";
import { generateCategorisePrompt } from "../../server/ai/generate-categorise-prompt";
import { getExpenseFilterParam } from "../get-expense-filter-params";
import { trpc } from "../trpc";

type CategorisedExpense = {
  expenseId: number;
  categoryId: number;
};

export function useHandleExpenseFetch(onFinishCategorising: () => void = () => null) {
  const { toast } = useToast();

  const utils = trpc.useUtils();
  const { statementIds, start, end, keyword, categoryIds, uncategorised, tagIds } = getExpenseFilterParam();

  const categories = trpc.category.list.useQuery();
  const { mutate: updateCategories } = trpc.expense.categorise.useMutation({
    onSuccess() {
      toast({ description: "Categorised successfully" });
      utils.expense.invalidate();
    },
  });

  const { complete } = useCompletion({
    onResponse: async (res) => {
      if (res.ok) {
        const response = await res.json();
        const completion = response.text;
        const categorised: CategorisedExpense[] = [];
        completion?.split("\n").forEach((line: string) => {
          const data = line.split(",");
          if (data.length === 4) {
            categorised.push({
              expenseId: Number(data[0]),
              categoryId: Number(data[3]),
            });
          }
        });
        onFinishCategorising();
        updateCategories(categorised);
      }
    },
  });

  const expenses = trpc.expense.list.useQuery({
    statementIds,
    dateRange: {
      start,
      end,
    },
    tagIds,
    keyword,
    categoryIds,
    uncategorised,
  });

  // handle categorise
  const handleAiCategorise = () => {
    const uncategorisedExpense =
      expenses.data?.map((expense) => {
        return {
          description: expense.description,
          tempId: expense.id,
        };
      }) || [];
    const promptText = generateCategorisePrompt(uncategorisedExpense, categories.data || []);
    complete(promptText);
  };

  let totalAmt = 0;
  expenses.data?.forEach((expense) => {
    totalAmt = currency(totalAmt).add(Number(expense.amount)).value;
  });

  const amount = totalAmt.toFixed(2);

  return { amount, expenses, handleAiCategorise };
}
