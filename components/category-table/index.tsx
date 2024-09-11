import { MouseEventHandler, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import { trpc } from "@/utils/trpc";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { Ellipsis } from "lucide-react";
import { CategoryFormAtom } from "../category-form";
import { ConfirmationDialogAtom } from "../confirmation-dialog";
import { useToast } from "../ui/use-toast";

type TableData = {
  id: number;
  title: string;
  keyword: string;
  color: string;
  optionClick?: {
    onEdit: MouseEventHandler<HTMLDivElement>;
    onDelete: MouseEventHandler<HTMLDivElement>;
  };
};

const columnHelper = createColumnHelper<TableData>();

const columns = [
  columnHelper.accessor("title", {
    cell: (info) => info.getValue(),
    header: () => <span>Name</span>,
  }),
  columnHelper.accessor("keyword", {
    cell: (info) => info.getValue(),
    header: () => <span>Keyword</span>,
  }),
  columnHelper.accessor("color", {
    cell: (info) => <div className="h-6 w-12 rounded" style={{ backgroundColor: info.getValue() }} />,
    header: () => <span>Color</span>,
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

const CategoryTable = () => {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // get data here
  const categories = trpc.category.list.useQuery();

  const { mutate: deleteCategory } = trpc.category.delete.useMutation({
    onSuccess() {
      toast({ description: "Category Deleted." });
      utils.category.invalidate();
    },
  });

  const [data, setData] = useState<TableData[]>(() => []);
  const [, setValue] = useAtom(CategoryFormAtom);
  const [, setConfirmationDialog] = useAtom(ConfirmationDialogAtom);

  useEffect(() => {
    if (categories.isSuccess && categories.data) {
      const tableData = categories.data.map((category) => {
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
          optionClick: {
            onEdit: () => {
              setValue({ isOpen: true, category: mappedData });
            },
            onDelete: () => {
              setConfirmationDialog({
                isOpen: true,
                title: "Delete Category",
                message: "Delete this category will affect its expenses.",
                onConfirm: () => {
                  deleteCategory(category.id);
                },
              });
            },
          },
        };
      });
      setData(tableData);
    }
  }, [categories.data, categories.isSuccess, deleteCategory, setValue]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="w-[800px] rounded-md border border-border">
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

export default CategoryTable;
