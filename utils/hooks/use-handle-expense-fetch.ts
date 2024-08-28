import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useCompletion } from "ai/react";
import dayjs from "dayjs";
import generateCategorisePrompt from "../../server/ai/generateCategorisePrompt";
import { DateRange, dateRangeKeyConvert } from "../date-range-key";
import { trpc } from "../trpc";

type CategorisedExpense = {
  expenseId: number;
  categoryId: number;
};

export function useHandleExpenseFetch(onFinishCategorising: () => void = () => null) {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const utils = trpc.useUtils();
  const statementIds = searchParams?.get("statementIds")?.split(",").map(Number) || [];
  const categoryIds = searchParams?.get("categoryIds")?.split(",").map(Number) || [];
  const keyword = searchParams?.get("keyword") || "";
  const dateRange = searchParams?.get("dateRange");
  const startDate = searchParams?.get("startDate");
  const endDate = searchParams?.get("endDate");
  let start = null;
  let end = null;

  const categories = trpc.category.list.useQuery();
  const { mutate: updateCategories } = trpc.expense.categorise.useMutation({
    onSuccess() {
      toast({ description: "Categorized successfully" });
      utils.expense.invalidate();
    },
  });

  const { complete } = useCompletion({
    onFinish: (_, completion) => {
      // {expenseId},{expense},{category},{categoryid}
      const categorised: CategorisedExpense[] = [];
      completion?.split("\n").forEach((line) => {
        const data = line.split(",");
        categorised.push({
          expenseId: Number(data[0]),
          categoryId: Number(data[3]),
        });
      });

      updateCategories(categorised);
    },
  });

  if (dateRange) {
    const [startDate, endDate] = dateRangeKeyConvert(dateRange as DateRange);
    start = dayjs(startDate).toISOString();
    end = dayjs(endDate).toISOString();
  }

  if (!dateRange && startDate && endDate) {
    const startDateParsed = dayjs(startDate, "YYYY-MM-DD");
    const endDateParsed = dayjs(endDate, "YYYY-MM-DD");

    if (startDateParsed.isValid() && endDateParsed.isValid()) {
      start = dayjs(startDateParsed).toISOString();
      end = dayjs(endDateParsed).toISOString();
    }
  }
  const expenses = trpc.expense.list.useQuery({
    statementIds,
    dateRange: {
      start,
      end,
    },
    keyword,
    categoryIds,
  });

  // handle categorize
  const handleAiCategorize = () => {
    const uncategorisedExpense =
      expenses.data?.result.map((expense) => {
        return {
          description: expense.description,
          tempId: expense.id,
        };
      }) || [];
    const promptText = generateCategorisePrompt(uncategorisedExpense, categories.data?.result || []);
    complete(promptText);
    onFinishCategorising();
  };

  return { expenses, handleAiCategorize };
}
