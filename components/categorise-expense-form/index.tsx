import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { useHandleExpenseFetch } from "@/utils/hooks/use-handle-expense-fetch";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import ExpenseTableUi, { ExpenseTableData } from "../expense-table-ui";
import { Button } from "../ui/button";

type CategoriseState = "default" | "categorising" | "done";

const columnHelper = createColumnHelper<ExpenseTableData>();

const columns = [
  columnHelper.accessor("description", {
    cell: (info) => info.getValue(),
    header: () => <span>Description</span>,
    meta: {
      className: "w-[400px]",
    },
  }),
  columnHelper.accessor("category", {
    cell: (info) => {
      if (!info.getValue()) return null;

      return (
        <div
          className="w-fit rounded-md px-3 py-0.5 capitalize"
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
    cell: (info) => dayjs(info.getValue()).format("YYYY MMM DD"),
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
  const [categoriseState, setCategoriseState] = useState<CategoriseState>("default");
  const { expenses, handleAiCategorise } = useHandleExpenseFetch(() => {
    setIsOpen(false);
  });

  const [data, setData] = useState<ExpenseTableData[]>(() => []);

  // option to categorise with in-house rules first

  useEffect(() => {
    if (expenses.data) {
      const tableData = expenses.data.result.map((expense) => {
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
  }, [expenses.data]);

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
        {categoriseState === "categorising" && <p>prompting and categorising...</p>}
        {categoriseState === "default" && (
          <>
            <p>Categorise the following {data.length} expense?</p>
            <ExpenseTableUi
              data={data}
              columns={columns}
              tableWrapperClass="max-h-[500px] overflow-y-scroll"
            />
            <div className="flex w-full flex-row-reverse">
              <Button
                onClick={() => {
                  handleAiCategorise({ onlyUncategorise: false });
                  setCategoriseState("categorising");
                }}>
                Categorise
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
