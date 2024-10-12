import currency from "currency.js";
import { getExpenseFilterParam } from "../get-expense-filter-params";
import { trpc } from "../trpc";

export function useHandleExpenseFetch() {
  const { statementIds, start, end, keyword, categoryIds, uncategorised, tagIds } = getExpenseFilterParam();

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

  let totalAmt = 0;
  expenses.data?.forEach((expense) => {
    totalAmt = currency(totalAmt).add(Number(expense.amount)).value;
  });
  const amount = totalAmt.toFixed(2);

  return { amount, expenses };
}
