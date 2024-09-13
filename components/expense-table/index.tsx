import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatToDisplayDate } from "@/utils/date-util";
import { useHandleExpenseFetch } from "@/utils/hooks/use-handle-expense-fetch";
import { trpc } from "@/utils/trpc";
import { Prisma } from "@prisma/client";
import { createColumnHelper } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { Ellipsis, StickyNoteIcon, Tag } from "lucide-react";
import { ConfirmationDialogAtom } from "../confirmation-dialog";
import { ExpenseFormAtom } from "../expense-form";
import ExpenseTableUi, { ExpenseTableData } from "../expense-table-ui";
import { useToast } from "../ui/use-toast";

const columnHelper = createColumnHelper<ExpenseTableData>();

const columns = [
  columnHelper.accessor("description", {
    cell: (info) => info.getValue(),
    header: () => <span>Description</span>,
    meta: {
      className: "w-[400px]",
    },
  }),
  columnHelper.accessor("note", {
    cell: (info) => {
      if (!info.getValue()) return null;

      return (
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger>
              <StickyNoteIcon size={16} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{info.getValue()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    header: () => <span />,
    meta: {
      className: "w-[20px]",
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
  columnHelper.accessor("tags", {
    cell: (info) => {
      if (!info.getValue() || info.getValue()?.length === 0) return null;

      return (
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger>
              <Tag size={16} />
            </TooltipTrigger>
            <TooltipContent className="border-input">
              <div className="flex flex-col gap-1">
                {info.getValue()?.map((tag) => {
                  return <p key={tag}>{tag}</p>;
                })}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    header: () => <span />,
    meta: {
      className: "w-[20px]",
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
  columnHelper.accessor("optionClick", {
    cell: (info) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Ellipsis size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={info.getValue()?.onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={info.getValue()?.onDelete}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    header: () => <span>Options</span>,
  }),
];

const ExpenseTable = () => {
  const [, setvalue] = useAtom(ExpenseFormAtom);
  const [, setConfirmationDialog] = useAtom(ConfirmationDialogAtom);

  const { expenses } = useHandleExpenseFetch();
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const { mutate: deleteExpenses } = trpc.expense.delete.useMutation({
    onSuccess() {
      toast({ description: "Expense Deleted." });
      setConfirmationDialog({ isOpen: false });
      utils.expense.invalidate();
    },
  });

  const tags = trpc.tag.list.useQuery();
  let tagById: Record<number, string> = {};

  if (tags.data) {
    tagById = tags.data.reduce((byId: Record<number, string>, curr) => {
      byId[curr.id] = curr.title;
      return byId;
    }, {});
  }

  const [data, setData] = useState<ExpenseTableData[]>(() => []);

  useEffect(() => {
    if (expenses.data) {
      const tableData = expenses.data.map((expense) => {
        const formattedType = {
          id: expense.id,
          createdAt: new Date(expense.createdAt),
          updatedAt: new Date(expense.updatedAt),
          amount: new Prisma.Decimal(expense.amount),
          description: expense.description,
          date: new Date(expense.date),
          statementId: expense.statementId,
          categoryId: expense.categoryId,
          userId: expense.userId,
          note: expense.note,
          tags: expense.tags.map((tag) => tag.tagId),
        };

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
          tags: expense.tags.map((tag) => tagById[tag.tagId]),
          optionClick: {
            onEdit: () => {
              setvalue({ isOpen: true, expense: formattedType });
            },
            onDelete: () => {
              setConfirmationDialog({
                isOpen: true,
                title: "Delete Expense",
                message: `Delete this expense: ${expense.description}`,
                onConfirm: () => {
                  deleteExpenses([expense.id]);
                },
              });
            },
          },
        };
      });

      setData(tableData);
    }
  }, [expenses.data, setvalue, deleteExpenses, setConfirmationDialog]);

  return <ExpenseTableUi data={data} columns={columns} />;
};

export default ExpenseTable;
