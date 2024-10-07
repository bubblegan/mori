import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import { trpc } from "@/utils/trpc";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { TagFormAtom } from "../tag-form";

type TableData = {
  id: number;
  title: string;
  onEdit: () => void;
};

const columnHelper = createColumnHelper<TableData>();

const columns = [
  columnHelper.accessor("title", {
    cell: (info) => info.getValue(),
    header: () => <span className="uppercase">Name</span>,
  }),
  columnHelper.accessor("onEdit", {
    cell: (info) => (
      <span className="cursor-pointer" onClick={info.getValue()}>
        Edit
      </span>
    ),
    header: () => <span>Options</span>,
  }),
];

const TagTable = () => {
  // get data here
  const tags = trpc.tag.list.useQuery();

  const [data, setData] = useState<TableData[]>(() => []);
  const [, setValue] = useAtom(TagFormAtom);

  useEffect(() => {
    if (tags.isSuccess && tags.data) {
      const tableData = tags.data.map((tag) => {
        const mappedData = {
          ...tag,
          createdAt: new Date(tag.createdAt),
          updatedAt: new Date(tag.updatedAt),
        };

        return {
          id: tag.id,
          title: tag.title,
          onEdit: () => setValue({ isOpen: true, tag: mappedData }),
        };
      });
      setData(tableData);
    }
  }, [tags.data, tags.isSuccess, setValue]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="w-[200px] rounded-md border border-border">
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

export default TagTable;
