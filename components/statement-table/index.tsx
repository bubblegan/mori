import { MouseEventHandler, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { Ellipsis } from "lucide-react";
import { ConfirmationDialogAtom } from "../confirmation-dialog";
import { StatementFormAtom } from "../statement-form";
import { useToast } from "../ui/use-toast";

type StatementTableData = {
  id: number;
  name: string;
  date: string;
  range: string;
  bank: string;
  totalAmount: number;
  createdAt: string;
  option: number;
  optionClick?: {
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
    header: () => <span />,
  }),
  columnHelper.accessor("name", {
    cell: (info) => info.getValue(),
    header: () => <span>Name</span>,
  }),
  columnHelper.accessor("date", {
    cell: (info) => info.getValue(),
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
    cell: (info) => info.getValue(),
    header: () => <span>Uploaded At</span>,
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

  const statements = trpc.statement.list.useQuery({ years });

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
            date: formatToDisplayDate(statement.date),
            range: `${formatToDisplayDate(statement.startdate)} - ${formatToDisplayDate(statement.enddate)}`,
            bank: statement.bank,
            totalAmount: statement.total,
            createdAt: formatToDisplayDate(statement.createdAt),
            option: statement.id,
            optionClick: {
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
  }, [statements.data, setValue, deleteStatement]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
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
                      "text-neutral-100",
                      header.column.getCanSort() && "cursor-pointer",
                      header.column.columnDef.meta?.className
                    )}
                    key={header.id}
                    colSpan={header.colSpan}
                    onClick={header.column.getToggleSortingHandler()}>
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
                  <TableCell className="w-fit py-5 text-neutral-100" key={cell.id}>
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
