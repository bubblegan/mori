import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { formatToDisplayDate } from "@/utils/date-util";
import { useHandleExpenseFetch } from "@/utils/hooks/use-handle-expense-fetch";
import { trpc } from "@/utils/trpc";
import { createColumnHelper } from "@tanstack/react-table";
import ExpenseTableUi, { ExpenseTableData } from "../expense-table-ui";
import { Button } from "../ui/button";

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
];

export function TagExpenseForm({
  isOpen = false,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (param: boolean) => void;
}) {
  const { expenses } = useHandleExpenseFetch();
  const { mutate: tagMany } = trpc.expense.tagMany.useMutation({
    onSuccess() {
      setIsOpen(false);
    },
  });

  const [tag, setTag] = useState("");
  const tags = trpc.tag.list.useQuery();

  const [data, setData] = useState<ExpenseTableData[]>(() => []);

  useEffect(() => {
    if (expenses) {
      const tableData = expenses.map((expense) => {
        return {
          id: expense.id,
          amount: `${Number(expense.amount).toFixed(2).toLocaleString()}`,
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
          <DialogTitle>Tagging</DialogTitle>
        </DialogHeader>
        <>
          <p>Tag the following {data.length} expense</p>
          <Select onValueChange={(value) => setTag(value)} defaultValue={"default"} value={tag}>
            <SelectTrigger className="h-8 w-32 border-neutral-500">
              <SelectValue className="mr-2 h-8 w-32" />
            </SelectTrigger>
            <SelectContent side="bottom" className="w-fit">
              <SelectGroup className="max-h-48 overflow-y-auto">
                {tags.data?.map((tag) => {
                  return (
                    <SelectItem className="h-9 w-32" key={tag.id} value={tag.id.toString()}>
                      {tag.title}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
          <ExpenseTableUi data={data} columns={columns} tableWrapperClass="max-h-[500px] overflow-y-scroll" />
          <div className="flex w-full flex-row-reverse">
            <Button
              disabled={!tag}
              onClick={() => {
                const param =
                  expenses.map((expense) => {
                    return {
                      expenseId: expense.id,
                      tagIds: [...expense.tags.map((tag) => tag.tagId), Number(tag)],
                    };
                  }) || [];

                tagMany(param);
              }}>
              Tag
            </Button>
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
}
