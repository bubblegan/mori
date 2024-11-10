import { MouseEventHandler, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { trpc } from "@/utils/trpc";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { Ellipsis } from "lucide-react";
import { ConfirmationDialogAtom } from "../confirmation-dialog";
import { TagFormAtom } from "../tag-form";
import { useToast } from "../ui/use-toast";

type TableData = {
  id: number;
  title: string;
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

const TagTable = () => {
  const { toast } = useToast();
  const tags = trpc.tag.list.useQuery();
  const utils = trpc.useUtils();

  const [data, setData] = useState<TableData[]>(() => []);
  const [, setValue] = useAtom(TagFormAtom);
  const [, setConfirmationDialog] = useAtom(ConfirmationDialogAtom);

  const { mutate: deleteTag } = trpc.tag.delete.useMutation({
    onSuccess() {
      toast({ description: "Tag Deleted." });
      setConfirmationDialog({ isOpen: false });
      utils.tag.invalidate();
    },
  });

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
          optionClick: {
            onEdit: () => {
              setValue({ isOpen: true, tag: mappedData });
            },
            onDelete: () => {
              setConfirmationDialog({
                isOpen: true,
                title: "Delete Tag",
                message: "Delete this tag will affect its expenses.",
                onConfirm: () => {
                  deleteTag(tag.id);
                },
              });
            },
          },
        };
      });
      setData(tableData);
    }
  }, [tags.data, tags.isSuccess, setValue, deleteTag, setConfirmationDialog]);

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
                    className={header.column.columnDef.meta?.className}
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
                  <TableCell className="w-fit py-5" key={cell.id}>
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
