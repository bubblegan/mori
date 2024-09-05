import { getExpenseFilterParam } from "../get-expense-filter-params";
import { trpc } from "../trpc";

export function useHandleMonthAggregate() {
  const { start, end } = getExpenseFilterParam();

  const expenses = trpc.expense.aggregateByMonth.useQuery({
    start,
    end,
  });

  return expenses;
}
