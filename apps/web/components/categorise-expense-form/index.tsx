import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { formatToDisplayDate } from "@/utils/date-util";
import { useCategoriseExpense } from "@/utils/hooks/use-categorise-expense";
import { useHandleExpenseFetch } from "@/utils/hooks/use-handle-expense-fetch";
import { trpc } from "@/utils/trpc";
import { createColumnHelper } from "@tanstack/react-table";
import { LoaderIcon } from "lucide-react";
import ExpenseTableUi, { ExpenseTableData } from "../expense-table-ui";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

const columnHelper = createColumnHelper<ExpenseTableData>();

const columns = [
  columnHelper.accessor("description", {
    cell: (info) => info.getValue(),
    header: () => <span>Description</span>,
    meta: {
      className: "w-fit max-w-[400px] min-w-[200px]",
    },
  }),
  columnHelper.accessor("category", {
    cell: (info) => {
      if (!info.getValue()) return null;

      return (
        <div
          className="w-fit rounded-md px-3 py-0.5 capitalize text-white"
          style={{ background: info.getValue()?.color }}>
          {info.getValue()?.title}
        </div>
      );
    },
    header: () => <span>Category</span>,
    sortingFn: (rowA, rowB) => {
      const titleA = rowA.original.category?.title || "";
      const titleB = rowB.original.category?.title || "";
      if (titleA < titleB) {
        return -1;
      }
      if (titleA > titleB) {
        return 1;
      }

      // names must be equal
      return 0;
    },
  }),
  columnHelper.accessor("amount", {
    cell: (info) => (
      <div className="flex justify-between">
        $<div className="pr-8 text-right">{info.getValue()}</div>
      </div>
    ),
    header: () => <span>Amount</span>,
    sortingFn: "alphanumeric",
    enableSorting: true,
    meta: {
      className: "w-[150px]",
    },
  }),
  columnHelper.accessor("date", {
    cell: (info) => formatToDisplayDate(info.getValue()),
    header: () => <span>Date</span>,
    sortingFn: (a, b) => {
      return new Date(b.original?.date || "").valueOf() - new Date(a.original?.date || "").valueOf();
    },
  }),
  columnHelper.accessor("statement", {
    cell: (info) => info.getValue(),
    header: () => <span>Statement</span>,
  }),
];

export function CategoriseExpenseForm({
  isOpen = false,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (param: boolean) => void;
}) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { expenses } = useHandleExpenseFetch();

  const { mutate: updateCategories } = trpc.expense.categorise.useMutation({
    onSuccess() {
      toast({ description: "Categorised successfully" });
      utils.expense.invalidate();
      setIsOpen(false);
    },
  });

  const { handleCategorise, isFetching } = useCategoriseExpense();

  const [data, setData] = useState<ExpenseTableData[]>(() => []);

  useEffect(() => {
    if (expenses) {
      const tableData = expenses.map((expense) => {
        return {
          id: expense.id,
          note: expense.note || "",
          amount: `${Number(expense.amount).toFixed(2).toLocaleString()}`,
          statement: expense.Statement?.name || "",
          description: expense.description,
          date: expense.date.toString(),
          category: {
            title: expense.Category?.title || "",
            color: expense.Category?.color || "",
          },
        };
      });
      setData(tableData);
    }
  }, [expenses]);

  return (
    <Dialog open={isOpen}>
      <DialogContent
        onCloseClick={() => {
          setIsOpen(false);
        }}
        className="min-w-fit">
        <DialogHeader>
          <DialogTitle>Categorise</DialogTitle>
        </DialogHeader>
        <p>Categorise the following {data.length} expense?</p>
        <ExpenseTableUi data={data} columns={columns} tableWrapperClass="max-h-[500px] overflow-y-scroll" />
        <div className="flex w-full flex-row-reverse">
          {isFetching ? (
            <Button disabled>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </Button>
          ) : (
            <Button
              onClick={async () => {
                if (expenses) {
                  const categorisedExpenses = await handleCategorise(expenses);
                  const updateCategoryParam = categorisedExpenses.map((expense) => {
                    return {
                      expenseId: expense.id,
                      categoryId: expense.categoryId,
                    };
                  });
                  updateCategories(updateCategoryParam);
                }
              }}
              disabled={isFetching}>
              Categorise
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
