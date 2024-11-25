import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import currency from "currency.js";
import dayjs from "dayjs";
import { atom, useAtom } from "jotai";
import { CheckIcon, LoaderCircle } from "lucide-react";

type TableData = {
  key: string;
  title: string;
  status: string;
  completedAt: string;
  promptTokens: number;
  completionTokens: number;
  pricing: string;
  onPreviewClick?: () => Promise<void>;
};

type Task = {
  status: string;
  key: string;
  title: string;
  completedAt?: Date;
  promptTokens?: number;
  completionTokens?: number;
  pricing?: number;
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
  columnHelper.accessor("completedAt", {
    cell: (info) => info.getValue(),
    header: () => <span>Completed On</span>,
  }),
  columnHelper.accessor("promptTokens", {
    cell: (info) => info.getValue(),
    header: () => <span>Prompt Tokens</span>,
  }),
  columnHelper.accessor("completionTokens", {
    cell: (info) => info.getValue(),
    header: () => <span>Completion Tokens</span>,
  }),
  columnHelper.accessor("pricing", {
    cell: (info) => info.getValue(),
    header: () => <span>Cost</span>,
  }),
  columnHelper.accessor("onPreviewClick", {
    cell: (info) => {
      if (info.getValue()) {
        return (
          <Button size={"sm"} onClick={info.getValue()}>
            Preview
          </Button>
        );
      }

      return <span />;
    },
    header: () => <span>Preview</span>,
  }),
];

const TaskTable = (props: { onPreviewClick: (id: string) => Promise<void> }) => {
  const { onPreviewClick } = props;

  const [data, setData] = useState<TableData[]>(() => []);
  const [checkAll, setCheckedAll] = useState(false);
  const [, setCheckedList] = useAtom(checkedTaskAtom);

  const taskQuery = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/task", {
        method: "GET",
      });

      return response.json();
    },
    refetchInterval: (query) => {
      const taskInQueue = query.state.data?.find((task) => {
        return task.status === "active";
      });

      if (taskInQueue) {
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
          completedAt: task.completedAt ? dayjs(task.completedAt).format("DD-MMM HH:mm") : "",
          promptTokens: task.promptTokens || 0,
          completionTokens: task.completionTokens || 0,
          pricing: task.pricing ? `~ ${currency(task.pricing).format()}` : "-",
          onPreviewClick: task.status === "completed" ? () => onPreviewClick(task.key) : undefined,
        };
      });
      setData(tableData);
    }
  }, [taskQuery.data, taskQuery.isSuccess, onPreviewClick]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="w-fit rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={header.column.columnDef.meta?.className}
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
                  <TableCell className="w-fit py-3" key={cell.id}>
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
