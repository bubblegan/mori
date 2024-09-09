import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import { useHandleCategoryAggregate } from "@/utils/hooks/use-handle-category-aggregate";
import { useHandleMonthAggregate } from "@/utils/hooks/use-handle-monthly-aggregate";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import { AggregateType } from "../../pages/expenses";
import { CategoryFormAtom } from "../category-form";

type TableData = {
  title: string;
  amount: number;
  count: number;
};

const columnHelper = createColumnHelper<TableData>();

const columns = [
  columnHelper.accessor("title", {
    cell: (info) => info.getValue(),
    header: () => <span>Title</span>,
  }),
  columnHelper.accessor("count", {
    cell: (info) => info.getValue(),
    header: () => <span>Transactions Count</span>,
  }),
  columnHelper.accessor("amount", {
    cell: (info) => (
      <div className="flex w-20 justify-between">
        $<span> {new Intl.NumberFormat().format(info.getValue())}</span>
      </div>
    ),
    header: () => <span>Total Amount</span>,
  }),
];

export function AggregateSummaryTable(props: { aggregateBy: AggregateType }) {
  const { aggregateBy } = props;

  const catAggregate = useHandleCategoryAggregate();
  const monthly = useHandleMonthAggregate();

  const [data, setData] = useState<TableData[]>(() => []);
  const [, setValue] = useAtom(CategoryFormAtom);

  useEffect(() => {
    if (catAggregate.isSuccess && catAggregate.data && aggregateBy === "category") {
      const tableData = catAggregate.data.map((category) => {
        return {
          title: category.title[0].toLocaleUpperCase() + category.title.substring(1),
          amount: category.amount,
          count: Number(category.count),
        };
      });
      setData(tableData);
    }
  }, [catAggregate.data, catAggregate.isSuccess, setValue, aggregateBy]);

  useEffect(() => {
    if (monthly.isSuccess && monthly.data && aggregateBy === "monthly") {
      const tableData = monthly.data?.map((month) => {
        return {
          title: dayjs(month.title).format("MMM YYYY"),
          amount: month.amount,
          count: Number(month.count),
        };
      });
      setData(tableData);
    }
  }, [monthly.data, monthly.isSuccess, setValue, aggregateBy]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="w-[600px] rounded-md border border-gray-700">
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
                  <TableCell className="w-fit py-4 text-neutral-100" key={cell.id}>
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
}
