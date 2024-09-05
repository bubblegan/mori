import { useToast } from "@/components/ui/use-toast";
import { useCompletion } from "ai/react";
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
  const { statementIds, start, end, keyword, categoryIds, uncategorised } = getExpenseFilterParam();

  const categories = trpc.category.list.useQuery();
  const { mutate: updateCategories } = trpc.expense.categorise.useMutation({
    onSuccess() {
      toast({ description: "Categorised successfully" });
      utils.expense.invalidate();
    },
  });

  const { complete } = useCompletion({
    onFinish: (_, completion) => {
      const categorised: CategorisedExpense[] = [];
      completion?.split("\n").forEach((line) => {
        const data = line.split(",");
        categorised.push({
          expenseId: Number(data[0]),
          categoryId: Number(data[3]),
        });
      });

      onFinishCategorising();
      updateCategories(categorised);
    },
  });

  const expenses = trpc.expense.list.useQuery({
    statementIds,
    dateRange: {
      start,
      end,
    },
    keyword,
    categoryIds,
    uncategorised,
  });

  // handle categorise
  const handleAiCategorise = ({ onlyUncategorise } = { onlyUncategorise: true }) => {
    const uncategorisedExpense =
      expenses.data?.result
        .filter((expense) => {
          if (onlyUncategorise) {
            return !expense.categoryId;
          }

          return true;
        })
        .map((expense) => {
          return {
            description: expense.description,
            tempId: expense.id,
          };
        }) || [];
    const promptText = generateCategorisePrompt(uncategorisedExpense, categories.data?.result || []);
    complete(promptText);
  };

  return { expenses, handleAiCategorise };
}
