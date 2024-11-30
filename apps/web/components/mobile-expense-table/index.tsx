import { useHandleExpenseFetch } from "@/utils/hooks/use-handle-expense-fetch";
import currency from "currency.js";
import dayjs from "dayjs";

export function MobileExpenseTable() {
  const { expenses } = useHandleExpenseFetch();

  return (
    <div className="flex w-full flex-col gap-4">
      {expenses.map((expense) => {
        return (
          <div
            className="flex w-full items-center justify-between gap-2 rounded-lg border p-2"
            key={expense.id}>
            <div className="flex flex-col gap-1">
              <span className="text-xs">{expense.description}</span>
              <div className="flex items-center gap-2">
                <span
                  className="w-fit rounded-md px-1 py-0.5 text-xs capitalize text-white"
                  style={{ background: expense.Category?.color }}>
                  {expense.Category?.title}
                </span>
                <span className="text-xs">{dayjs(expense.date).format("DD MMM")}</span>
              </div>
            </div>
            <span>{currency(Number(expense.amount)).format()}</span>
          </div>
        );
      })}
    </div>
  );
}
