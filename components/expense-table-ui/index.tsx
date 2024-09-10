import { MouseEventHandler, useState } from "react";
import { Button } from "@/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export type ExpenseTableData = {
  id?: number;
  amount?: string;
  statement?: string;
  category?: {
    title: string;
    color: string;
  };
  tags?: string[];
  note?: string;
  description?: string;
  date?: string;
  optionClick?: {
    onEdit: MouseEventHandler<HTMLDivElement>;
    onDelete: MouseEventHandler<HTMLDivElement>;
  };
};

const ExpenseTableUi = ({
  data,
  columns,
  tableWrapperClass,
}: {
  data: ExpenseTableData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<ExpenseTableData, any>[];
  tableWrapperClass?: string;
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
        pageIndex: 0,
      },
    },
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className={cn("rounded-md border border-gray-700", tableWrapperClass)}>
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

      <div className="flex items-center justify-end gap-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-white">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}>
            <SelectTrigger className="h-8 w-[70px] border-neutral-500">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[15, 30, 45, 60].map((pageSize) => (
                <SelectItem className="text-neutral-200" key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium text-white">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}>
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4 text-white" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4 text-white" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4 text-white" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}>
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTableUi;
