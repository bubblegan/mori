import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import { trpc } from "@/utils/trpc";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { CategoryFormAtom } from "../category-form";

interface TableData {
  id: number;
  title: string;
  keyword: string;
  color: string;
  onEdit: () => void;
}

const columnHelper = createColumnHelper<TableData>();

const columns = [
  columnHelper.accessor("title", {
    cell: (info) => info.getValue(),
    header: () => <span className="uppercase">Name</span>,
  }),
  columnHelper.accessor("keyword", {
    cell: (info) => info.getValue(),
    header: () => <span className="uppercase">Keyword</span>,
  }),
  columnHelper.accessor("color", {
    cell: (info) => <div className="w-12 h-6 rounded" style={{ backgroundColor: info.getValue() }} />,
    header: () => <span className="uppercase">Color</span>,
  }),
  columnHelper.accessor("onEdit", {
    cell: (info) => (
      <span className="cursor-pointer uppercase" onClick={info.getValue()}>
        Edit
      </span>
    ),
    header: () => <span>Options</span>,
  }),
];

const CategoryTable = () => {
  // get data here
  const categories = trpc.category.list.useQuery();

  const [data, setData] = useState<TableData[]>(() => []);
  const [, setValue] = useAtom(CategoryFormAtom);

  useEffect(() => {
    if (categories.isSuccess && categories.data) {
      const tableData = categories.data.result.map((category) => {
        const mappedData = {
          ...category,
          createdAt: new Date(category.createdAt),
          updatedAt: new Date(category.updatedAt),
        };

        return {
          id: category.id,
          title: category.title,
          keyword: category.keyword.join(", "),
          color: category.color,
          onEdit: () => setValue({ isOpen: true, category: mappedData }),
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
      <div className="rounded-md border border-gray-700 w-[800px]">
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

export default CategoryTable;
