import { trpc } from "@/utils/trpc";
import { useCompletion } from "ai/react";
import dayjs from "dayjs";
import { ParsedStatement, ParsedExpense } from ".";

export function useParsingCompletion(onFinish: (parsedData: [ParsedStatement, ParsedExpense[]]) => void) {
  const categories = trpc.category.list.useQuery();
  const categoriesMap: Record<number, string> = {};
  if (categories.data?.result) {
    categories.data?.result.forEach((category) => {
      categoriesMap[category.id] = category.title;
    });
  }

  const { complete, isLoading, completion } = useCompletion({
    onFinish: (_, completion) => {
      const parsedExpenses: ParsedExpense[] = [];

      const parseStatementResult: ParsedStatement = {
        bank: "",
        statementDate: null,
        totalAmount: 0,
      };

      // format the completion
      completion?.split("\n").forEach((line, index) => {
        if (line.indexOf("bank:") === 0) {
          parseStatementResult.bank = line.slice(line.indexOf(":") + 1).trim();
        }

        if (line.indexOf("total amount:") === 0) {
          parseStatementResult.totalAmount = Number(line.slice(line.indexOf(":") + 1).trim());
        }

        if (line.indexOf("statement date:") === 0) {
          const dateArr = line
            .slice(line.indexOf(":") + 1)
            .trim()
            .toLocaleLowerCase()
            .split(" ");
          dateArr[1] = dateArr[1].charAt(0).toUpperCase() + dateArr[1].slice(1);
          parseStatementResult.statementDate = dayjs(dateArr.join(" "), "DD MMM YYYY").toDate();
        }

        if (line.split(",").length === 3) {
          const data = line.split(",").map((data) => data.trim());
          const date = dayjs(data[0], "DD MMM YYYY");

          parsedExpenses.push({
            tempId: index,
            date: date.isValid() ? date.toDate() : new Date(),
            description: data[1],
            amount: Number(data[2]),
          });
        }
      });

      parsedExpenses.forEach((expense) => {
        categories.data?.result.forEach((category) => {
          if (Array.isArray(category.keyword) && category.keyword.length > 0) {
            category.keyword?.forEach((keyword) => {
              if (expense.description.toLowerCase().includes(keyword as string) && keyword) {
                expense.categoryId = category.id;
                expense.categoryTitle = category.title;
              }
            });
          }
        });
      });

      onFinish([parseStatementResult, parsedExpenses]);
    },
  });

  return {
    complete,
    isLoading,
    completion,
  };
}
