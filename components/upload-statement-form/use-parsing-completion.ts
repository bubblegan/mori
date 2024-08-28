import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { trpc } from "@/utils/trpc";
import { useCompletion } from "ai/react";
import dayjs from "dayjs";
import { ParsedStatement, PromptingState, ParsedExpense, UploadingState } from ".";
import generateCategorisePrompt from "../../server/ai/generateCategorisePrompt";

export function useParsingCompletion(setUploadingState: Dispatch<SetStateAction<UploadingState>>) {
  const [parsedStatement, setParsedStatement] = useState<ParsedStatement | undefined>(undefined);
  const [parsedExpense, setParsedExpense] = useState<ParsedExpense[]>([]);
  const [promptState, setPromptState] = useState<PromptingState>("parsing");
  const [enableAiCategorise, setEnableAiCategorise] = useState(false);

  const categories = trpc.category.list.useQuery();
  const categoriesMap: Record<number, string> = {};
  if (categories.data?.result) {
    categories.data?.result.forEach((category) => {
      categoriesMap[category.id] = category.title;
    });
  }

  const { complete, isLoading, completion } = useCompletion({
    onFinish: (_, completion) => {
      if (promptState === "parsing") {
        const parsedExpense: ParsedExpense[] = [];

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

            parsedExpense.push({
              tempId: index,
              date: date.isValid() ? date.toDate() : new Date(),
              description: data[1],
              amount: Number(data[2]),
            });
          }
        });

        parsedExpense.forEach((expense) => {
          categories.data?.result.forEach((category) => {
            if (Array.isArray(category.keyword) && category.keyword.length > 0) {
              category.keyword?.forEach((keyword) => {
                if (expense.description.toLowerCase().includes(keyword as string) && keyword) {
                  expense.categoryId = category.id;
                  expense.categoryName = category.title;
                }
              });
            }
          });
        });

        setParsedStatement(parseStatementResult);
        setParsedExpense(parsedExpense);
        if (enableAiCategorise) {
          setPromptState("categorise");
        } else {
          setUploadingState("done");
        }
      }

      if (promptState === "categorise") {
        const categorisedRecord: Record<string, string> = {};
        completion?.split("\n").forEach((line) => {
          const data = line.split(",");
          categorisedRecord[data[0]] = data[3];
        });

        const parsedExpenseCategorised = parsedExpense.map((expense) => {
          if (expense.tempId && categorisedRecord[expense.tempId]) {
            expense.categoryId = Number(categorisedRecord[expense.tempId]);
            expense.categoryName = categoriesMap[Number(categorisedRecord[expense.tempId])];
          }
          return expense;
        });

        setParsedExpense(parsedExpenseCategorised);
        setUploadingState("done");
      }
    },
  });

  useEffect(() => {
    if (promptState === "categorise" && enableAiCategorise) {
      const uncategorisedExpense = parsedExpense.filter((expense) => !!expense.categoryId);
      const promptText = generateCategorisePrompt(uncategorisedExpense, categories.data?.result || []);
      complete(promptText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptState, enableAiCategorise]);

  return {
    complete,
    isLoading,
    completion,
    parsedStatement,
    parsedExpense,
    setParsedExpense,
    setEnableAiCategorise,
    enableAiCategorise,
  };
}
