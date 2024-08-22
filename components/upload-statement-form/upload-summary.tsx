import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import { flexRender, useReactTable, createColumnHelper, getCoreRowModel } from "@tanstack/react-table";
import dayjs from "dayjs";
import { ParsedExpense, ParsedStatement } from "./index";

type ParsedExpenseTable = {
  description?: string;
  amount?: string;
  category?: string;
  date?: string;
};

type UploadSummaryProps = {
  parsedStatement?: ParsedStatement;
  parsedExpenses?: ParsedExpense[];
  onCreateClick: () => void;
  onCloseClick: () => void;
  onDownloadCsvClick: () => void;
};

const columnHelper = createColumnHelper<ParsedExpenseTable>();

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
      return <div className="w-fit rounded-full px-3 py-0.5 capitalize">{info.getValue()}</div>;
    },
    header: () => <span>Category</span>,
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
    cell: (info) => info.getValue(),
    header: () => <span>Date</span>,
  }),
];

const UploadSummary = (props: UploadSummaryProps) => {
  const { parsedExpenses, parsedStatement, onCreateClick, onCloseClick, onDownloadCsvClick } = props;

  const [data, setTableData] = useState<ParsedExpenseTable[]>([]);

  useEffect(() => {
    const tableData: ParsedExpenseTable[] =
      parsedExpenses?.map((expense) => {
        return {
          description: expense.description,
          amount: expense.amount.toString(),
          category: expense.categoryName,
          date: dayjs(expense.date).format("DD MMM YYYY"),
        };
      }) || [];

    setTableData(tableData);
  }, [parsedExpenses]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <p>Bank : {parsedStatement?.bank} </p>
      <p>Issued Date : {dayjs(parsedStatement?.statementDate).format("DD MMM YYYY")}</p>
      <p>Total Amount : {parsedStatement?.totalAmount}</p>
      <div className="h-[500px] overflow-y-scroll rounded-md border border-gray-700">
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
              <TableRow className="hover:bg-muted/50" key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell className="w-fit py-4 text-neutral-100" key={cell.id}>
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
