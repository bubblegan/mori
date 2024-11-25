import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { fetchExpenseCompletion } from "@/utils/ai/fetch-completion";
import { formatCategoryIdByName } from "@/utils/format-categoryId-by-name";
import { trpc } from "@/utils/trpc";
import { LoaderIcon } from "lucide-react";

type ExpenseAiResponse = {
  description: string;
  category: string;
  date: string;
  amount: number;
};

export function AiExpenseForm() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const categories = trpc.category.list.useQuery();

  const { mutate: createExpense } = trpc.expense.create.useMutation({
    onSuccess() {
      toast({ description: "Expense Created." });
    },
  });

  const handleFetchingExpense = async () => {
    try {
      setIsLoading(true);
      const expenseFromAi: ExpenseAiResponse = await fetchExpenseCompletion(
        prompt,
        categories.data?.map((category) => category.title) || []
      );

      const categoryIdByName = formatCategoryIdByName(categories.data || []);

      createExpense({
        description: expenseFromAi.description,
        categoryId: categoryIdByName[expenseFromAi.category],
        amount: expenseFromAi.amount,
        date: new Date(expenseFromAi.date),
      });

      setIsLoading(false);
      setPrompt("");
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="flex flex-col items-end gap-2">
      <Input
        type="text"
        placeholder="Enter here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        maxLength={200}
        disabled={isLoading}
        autoFocus={true}
        className="w-full rounded border p-2 text-xl"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleFetchingExpense();
          }
        }}
      />
      <Button onClick={handleFetchingExpense}>
        {isLoading ? "" : "Insert"} {isLoading && <LoaderIcon className="h-4 w-4 animate-spin" />}
      </Button>
    </div>
  );
}
