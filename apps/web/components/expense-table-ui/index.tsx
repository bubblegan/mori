import { MouseEventHandler, useEffect, useState } from "react";
import { useRouter } from "next/router";
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
  isManualPagination = false,
  isManualSorting = false,
  rowCount = undefined,
}: {
  data: ExpenseTableData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<ExpenseTableData, any>[];
  tableWrapperClass?: string;
  isManualPagination?: boolean;
  isManualSorting?: boolean;
  rowCount?: number | undefined;
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();
  const [pagination, setPagination] = useState({
    pageIndex: 0, //initial page index
    pageSize: 15, //default page size
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");
    const per = params.get("per");

    if (page && Number(page) > 0) {
      setPagination((prev) => ({
        ...prev,
        pageIndex: Number(page) - 1,
      }));
    }

    if (per && Number(page) > 0) {
      setPagination((prev) => ({
        ...prev,
        pageSize: Number(per),
      }));
    }
  }, []);

  useEffect(() => {
    if (isManualPagination) {
      const params = new URLSearchParams(window.location.search);
      params.set("page", (pagination.pageIndex + 1).toString());
      params.set("per", pagination.pageSize.toString());
      router.push(`/expenses?${params.toString()}`, undefined, {
        shallow: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, isManualPagination]);

  useEffect(() => {
    if (isManualSorting) {
      const params = new URLSearchParams(window.location.search);
      if (sorting[0]) {
        params.set("order-by", sorting[0]?.id);
        params.set("dir", sorting[0]?.desc ? "desc" : "asc");
      } else {
        params.delete("order-by");
        params.delete("dir");
      }

      router.push(`/expenses?${params.toString()}`, undefined, {
        shallow: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting, isManualSorting]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: isManualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: isManualPagination ? undefined : getPaginationRowModel(),
    manualPagination: isManualPagination,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    rowCount: isManualPagination ? rowCount : undefined,
    onPaginationChange: setPagination,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className={cn("rounded-md border border-border", tableWrapperClass)}>
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
                  <TableCell className="w-fit py-4" key={cell.id}>
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
          <p className="text-sm font-medium text-primary">Rows per page</p>
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
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium text-primary">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}>
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4 text-primary" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4 text-primary" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4 text-primary" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}>
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTableUi;
