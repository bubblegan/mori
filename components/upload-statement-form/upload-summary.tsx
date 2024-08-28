import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import { useClickAway } from "@/utils/hooks/use-click-away";
import { trpc } from "@/utils/trpc";
import {
  flexRender,
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import CustomCell from "./custom-cell";
import DateCell from "./date-cell";
import { ParsedExpense, ParsedStatement } from "./index";

export type ParsedExpenseTable = {
  tempId: number;
  description?: string;
  amount?: string;
  category?: number;
  date?: Date;
};

type UploadSummaryProps = {
  parsedStatement?: ParsedStatement;
  parsedExpenses?: ParsedExpense[];
  setParsedExpense: Dispatch<SetStateAction<ParsedExpense[]>>;
  onCreateClick: () => void;
  onCloseClick: () => void;
  onDownloadCsvClick: () => void;
};

const columnHelper = createColumnHelper<ParsedExpenseTable>();

const columns = [
  columnHelper.accessor("description", {
    cell: CustomCell,
    header: () => <span>Description</span>,
    meta: {
      className: "w-[300px]",
      editField: "description",
      type: "text",
    },
  }),
  columnHelper.accessor("category", {
    cell: CustomCell,
    header: () => <span>Category</span>,
    meta: {
      className: "w-[150px]",
      type: "select",
      editField: "categoryId",
    },
  }),
  columnHelper.accessor("amount", {
    cell: CustomCell,
    header: () => <span>Amount</span>,
    sortingFn: "alphanumeric",
    enableSorting: true,
    meta: {
      className: "w-[150px]",
      editField: "amount",
      type: "number",
    },
  }),
  columnHelper.accessor("date", {
    cell: DateCell,
    header: () => <span>Date</span>,
    meta: {
      editField: "date",
    },
  }),
];

const UploadSummary = (props: UploadSummaryProps) => {
  const {
    parsedExpenses,
    parsedStatement,
    onCreateClick,
    onCloseClick,
    onDownloadCsvClick,
    setParsedExpense,
  } = props;

  const [data, setTableData] = useState<ParsedExpenseTable[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editCellId, setEditCellId] = useState<string | undefined>(undefined);
  const ref = useClickAway<HTMLTableSectionElement>(() => {
    setTimeout(() => {
      setEditCellId(undefined);
    }, 300);
  });
  const categories = trpc.category.list.useQuery();

  useEffect(() => {
    const tableData: ParsedExpenseTable[] =
      parsedExpenses?.map((expense) => {
        return {
          tempId: expense.tempId,
          description: expense.description,
          amount: expense.amount.toString(),
          category: expense.categoryId,
          date: expense.date,
        };
      }) || [];

    setTableData(tableData);
  }, [parsedExpenses]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    meta: {
      editCellId,
      updateData: (rowIndex: number, columnName: string, newValue: string | number) => {
        const tempId = data[rowIndex]?.tempId;
        setParsedExpense((old) => {
          return old.map((row) => {
            if (row.tempId === tempId) {
              if (columnName === "categoryId") {
                const selectedCat = categories.data?.result.find((cat) => cat.id === Number(newValue));

                return {
                  ...row,
                  [columnName]: Number(newValue),
                  categoryName: selectedCat?.title,
                };
              }
              return {
                ...row,
                [columnName]: newValue,
              };
            }
            return row;
          });
        });
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
  });

  return (
    <>
      <p>Bank : {parsedStatement?.bank} </p>
      <p>Issued Date : {dayjs(parsedStatement?.statementDate).format("DD MMM YYYY")}</p>
      <p>Total Amount : {parsedStatement?.totalAmount}</p>
      <div className="max-h-[500px] overflow-y-scroll rounded-md border border-gray-700">
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
          <TableBody ref={ref}>
            {table.getRowModel().rows.map((row) => (
              <TableRow className="hover:bg-muted/50" key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    onClick={() => {
                      setEditCellId(cell.id);
                    }}
                    className="w-fit py-4 text-neutral-100"
                    key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-row-reverse gap-3">
        <Button onClick={onCloseClick} className="w-fit">
          Close
        </Button>
        <Button onClick={onCreateClick} className="w-fit">
          Store
        </Button>
        <Button onClick={onDownloadCsvClick} className="w-fit">
          Download
        </Button>
      </div>
    </>
  );
};

export default UploadSummary;
