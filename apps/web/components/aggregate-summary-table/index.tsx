import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import { useHandleCategoryAggregate } from "@/utils/hooks/use-handle-category-aggregate";
import { useHandleMonthAggregate } from "@/utils/hooks/use-handle-monthly-aggregate";
import { sentenceCase } from "@/utils/sentence-case";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import { ChevronDown, ChevronUp } from "lucide-react";
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
    sortingFn: "alphanumeric",
    header: () => <span>Total Amount</span>,
  }),
];

export function AggregateSummaryTable(props: { aggregateBy: AggregateType }) {
  const { aggregateBy } = props;

  const catAggregate = useHandleCategoryAggregate();
  const monthly = useHandleMonthAggregate();

  const [data, setData] = useState<TableData[]>(() => []);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [, setValue] = useAtom(CategoryFormAtom);

  useEffect(() => {
    if (catAggregate.isSuccess && catAggregate.data && aggregateBy === "category") {
      const tableData = catAggregate.data.map((category) => {
        return {
          title: sentenceCase(category.title),
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
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="w-[600px] rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={cn("cursor-pointer", header.column.columnDef.meta?.className)}
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    colSpan={header.colSpan}>
                    <span className="flex flex-row items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ChevronUp size={16} />,
                        desc: <ChevronDown size={16} />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
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
    </div>
  );
}
