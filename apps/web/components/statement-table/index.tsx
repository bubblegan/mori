import { MouseEventHandler, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import { formatToDisplayDate } from "@/utils/date-util";
import { trpc } from "@/utils/trpc";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { atom, useAtom } from "jotai";
import { CheckIcon, Ellipsis } from "lucide-react";
import { ConfirmationDialogAtom } from "../confirmation-dialog";
import { StatementFormAtom } from "../statement-form";
import { useToast } from "../ui/use-toast";

type StatementTableData = {
  id: number;
  name: string;
  date: Date;
  range: string;
  bank: string;
  totalAmount: number;
  createdAt: Date;
  option: number;
  optionClick?: {
    viewExpenses: MouseEventHandler<HTMLDivElement>;
    onEdit: MouseEventHandler<HTMLDivElement>;
    onDelete: MouseEventHandler<HTMLDivElement>;
  };
};

export const checkedStatementAtom = atom<number[]>([]);

const columnHelper = createColumnHelper<StatementTableData>();

const CheckStatement = (props: { id: number }) => {
  const { id } = props;
  const [checkedList, setCheckedList] = useAtom(checkedStatementAtom);
  return (
    <Checkbox
      checked={checkedList.includes(id)}
      onCheckedChange={() => {
        if (!checkedList.includes(id)) {
          // check
          setCheckedList([...checkedList, id]);
        } else {
          // uncheck
          setCheckedList(checkedList.filter((checkId) => checkId !== id));
        }
      }}
      id={`${id}`}
    />
  );
};

const columns = [
  columnHelper.accessor("id", {
    cell: (info) => <CheckStatement id={info.getValue()} />,
    header: () => <CheckIcon className="cursor-pointer" />,
  }),
  columnHelper.accessor("name", {
    cell: (info) => info.getValue(),
    header: () => <span>Name</span>,
  }),
  columnHelper.accessor("date", {
    cell: (info) => formatToDisplayDate(info.getValue()),
    header: () => <span>Issue Date</span>,
    sortingFn: (a, b) => {
      return new Date(b.original?.date || "").valueOf() - new Date(a.original?.date || "").valueOf();
    },
  }),
  columnHelper.accessor("range", {
    cell: (info) => info.getValue(),
    header: () => <span>Date Range</span>,
  }),
  columnHelper.accessor("createdAt", {
    cell: (info) => formatToDisplayDate(info.getValue()),
    header: () => <span>Uploaded At</span>,
    sortingFn: (a, b) => {
      return (
        new Date(b.original?.createdAt || "").valueOf() - new Date(a.original?.createdAt || "").valueOf()
      );
    },
  }),
  columnHelper.accessor("bank", {
    cell: (info) => info.getValue(),
    header: () => <span>Bank</span>,
  }),
  columnHelper.accessor("totalAmount", {
    cell: (info) => (
      <div className="flex justify-between">
        $<div className="pr-8 text-right">{Number(info.getValue()).toLocaleString()}</div>
      </div>
    ),
    meta: {
      className: "w-[160px]",
    },
    header: () => <span>Total Amount</span>,
  }),
  columnHelper.accessor("optionClick", {
    cell: (info) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Ellipsis size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={info.getValue()?.viewExpenses}>View Expenses</DropdownMenuItem>
          <DropdownMenuItem onClick={info.getValue()?.onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={info.getValue()?.onDelete}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    header: () => <span>Options</span>,
  }),
];

const StatementTable = () => {
  const searchParams = useSearchParams();
  const years = searchParams?.get("years")?.split(",").map(Number);
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const router = useRouter();

  const statements = trpc.statement.list.useQuery({ years });

  const [checkAll, setCheckedAll] = useState(false);
  const [, setCheckedList] = useAtom(checkedStatementAtom);
  const [, setValue] = useAtom(StatementFormAtom);
  const [, setConfirmationDialog] = useAtom(ConfirmationDialogAtom);
  const [data, setData] = useState<StatementTableData[]>(() => []);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { mutate: deleteStatement } = trpc.statement.delete.useMutation({
    onSuccess() {
      toast({ description: "Statement Deleted." });
      setConfirmationDialog({ isOpen: false });
      utils.statement.invalidate();
      utils.expense.invalidate();
    },
  });

  useEffect(() => {
    if (statements.data) {
      const tableData =
        statements.data?.map((statement) => {
          return {
            id: statement.id,
            name: statement.name,
            date: statement.date,
            range: `${formatToDisplayDate(statement.startdate)} - ${formatToDisplayDate(statement.enddate)}`,
            bank: statement.bank,
            totalAmount: statement.total,
            createdAt: statement.createdAt,
            option: statement.id,
            optionClick: {
              viewExpenses: () => {
                router.push(`/expenses?statement-ids=${statement.id}`);
              },
              onEdit: () => {
                setValue({ isOpen: true, statement: { id: statement.id, fileName: statement.name } });
              },
              onDelete: () => {
                setConfirmationDialog({
                  isOpen: true,
                  title: "Delete Statement",
                  message: "Delete this statement will delete its transactions too.",
                  onConfirm: () => {
                    deleteStatement([statement.id]);
                  },
                });
              },
            },
          };
        }) || [];
      setData(tableData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statements.data, setValue, deleteStatement]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={cn(
                      header.column.getCanSort() && "cursor-pointer",
                      header.column.columnDef.meta?.className
                    )}
                    key={header.id}
                    colSpan={header.colSpan}
                    onClick={
                      header.column.id === "id"
                        ? () => {
                            if (statements.data) {
                              const keys = statements.data.map((data) => data.id);
                              if (!checkAll) {
                                setCheckedList(keys);
                                setCheckedAll(true);
                              } else {
                                setCheckedList([]);
                                setCheckedAll(false);
                              }
                            }
                            return;
                          }
                        : header.column.getToggleSortingHandler()
                    }>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell className="w-fit py-5" key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StatementTable;
