import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import useHandleAggregateSum from "@/utils/hooks/useHandleAggregateSum";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { CategoryFormAtom } from "../category-form";

interface TableData {
  title: string;
  amount: string;
}

const columnHelper = createColumnHelper<TableData>();

const columns = [
  columnHelper.accessor("title", {
    cell: (info) => info.getValue(),
    header: () => <span className="uppercase">Name</span>,
  }),
  columnHelper.accessor("amount", {
    cell: (info) => info.getValue(),
    header: () => <span className="uppercase">Amount</span>,
  }),
];

const CategorySummaryTable = () => {
  // get data here
  const categories = useHandleAggregateSum();

  const [data, setData] = useState<TableData[]>(() => []);
  const [, setValue] = useAtom(CategoryFormAtom);

  useEffect(() => {
    if (categories.isSuccess && categories.data) {
      const tableData = categories.data.result.map((category) => {
        return {
          title: category.title,
          amount: category.amount,
        };
      });
      setData(tableData);
    }
  }, [categories.data, categories.isSuccess, setValue]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-gray-700 w-[600px]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={cn("text-neutral-100", header.column.columnDef.meta?.className)}
                    key={header.id}
                    colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell className="text-neutral-100 py-5 w-fit" key={cell.id}>
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

export default CategorySummaryTable;
