import { getExpenseFilterParam } from "../get-expense-filter-params";
import { trpc } from "../trpc";

export function useHandleMinimalExpense(isEnabled: boolean) {
  const { statementIds, start, end, keyword, categoryIds, uncategorised, tagIds, page, per, orderBy, dir } =
    getExpenseFilterParam();

  const result = trpc.expense.listMinimal.useQuery(
    {
      statementIds,
      dateRange: {
        start,
        end,
      },
      tagIds,
      keyword,
      categoryIds,
      uncategorised,
    },
    {
      enabled: isEnabled,
    }
  );

  return result;
}
