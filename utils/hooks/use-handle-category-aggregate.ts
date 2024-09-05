import { getExpenseFilterParam } from "../get-expense-filter-params";
import { trpc } from "../trpc";

export function useHandleCategoryAggregate() {
  const { statementIds, start, end } = getExpenseFilterParam();

  const expenses = trpc.category.aggregate.useQuery({
    statementIds,
    dateRange: {
      start,
      end,
    },
  });

  return expenses;
}
