import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import cn from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { atom, useAtom } from "jotai";
import { CheckIcon, LoaderCircle } from "lucide-react";
import { Checkbox } from "../ui/checkbox";

type TableData = {
  key: string;
  title: string;
  status: string;
};

export const checkedTaskAtom = atom<string[]>([]);

const columnHelper = createColumnHelper<TableData>();

const CheckTask = (props: { id: string }) => {
  const { id } = props;
  const [checkedList, setCheckedList] = useAtom(checkedTaskAtom);
  return (
    <div className="max-h-4">
      <Checkbox
        checked={checkedList.includes(id)}
        onCheckedChange={() => {
          if (!checkedList.includes(id)) {
            // check
            setCheckedList([...checkedList, id]);
          } else {
            // uncheck
            setCheckedList(checkedList.filter((checkId) => checkId !== id));
          }
        }}
        id={`check_${id}`}
      />
    </div>
  );
};

const columns = [
  columnHelper.accessor("key", {
    cell: (info) => <CheckTask id={info.getValue()} />,
    header: () => <CheckIcon className="cursor-pointer" />,
  }),
  columnHelper.accessor("title", {
    cell: (info) => info.getValue(),
    header: () => <span>Title</span>,
  }),
  columnHelper.accessor("status", {
    cell: (info) => {
      if (info.getValue() === "active") {
        return <LoaderCircle className="animate-spin" />;
      }

      return <span>{info.getValue()}</span>;
    },
    header: () => <span>Status</span>,
  }),
];

const TaskTable = () => {
  const [data, setData] = useState<TableData[]>(() => []);
  const [checkAll, setCheckedAll] = useState(false);
  const [, setCheckedList] = useAtom(checkedTaskAtom);

  const taskQuery = useQuery<{ key: string; status: string; title: string }[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/task", {
        method: "GET",
      });

      return response.json();
    },
    refetchInterval: (query) => {
      const jobInQueue = query.state.data?.find((job) => {
        return job.status === "active";
      });

      if (jobInQueue) {
        return 2000;
      }
      return undefined;
    },
  });

  useEffect(() => {
    if (taskQuery.isSuccess && taskQuery.data) {
      const tableData = taskQuery.data.map((task) => {
        return {
          key: task.key,
          title: task.title,
          status: task.status,
        };
      });
      setData(tableData);
    }
  }, [taskQuery.data, taskQuery.isSuccess]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="w-[400px] rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={cn("text-neutral-100", header.column.columnDef.meta?.className)}
                    key={header.id}
                    colSpan={header.colSpan}
                    onClick={() => {
                      if (header.id === "key") {
                        if (taskQuery.data) {
                          const keys = taskQuery.data
                            .filter((data) => data.status === "completed")
                            .map((data) => data.key);
                          if (!checkAll) {
                            setCheckedList(keys);
                            setCheckedAll(true);
                          } else {
                            setCheckedList([]);
                            setCheckedAll(false);
                          }
                        }
                      }
                    }}>
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
                  <TableCell className="w-fit py-3 text-neutral-100" key={cell.id}>
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

export default TaskTable;
