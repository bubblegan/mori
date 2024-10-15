import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { useAtom } from "jotai";
import { ConfirmationDialogAtom } from "../confirmation-dialog";
import { checkedStatementAtom } from "../statement-table";

const StatementOptionDropdown = () => {
  const [checkedList] = useAtom(checkedStatementAtom);
  const [, setConfirmationDialog] = useAtom(ConfirmationDialogAtom);

  const utils = trpc.useUtils();

  const { mutate: deleteStatement } = trpc.statement.delete.useMutation({
    onSuccess() {
      utils.statement.invalidate();
      utils.expense.invalidate();
    },
  });

  const downloadStatements = useCallback(async () => {
    const response = await fetch("/api/download", {
      method: "POST",
      body: JSON.stringify({ id: checkedList }),
      headers: new Headers({
        "content-type": "application/json",
        Accept: "application/pdf",
      }),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = response.headers.get("content-disposition");
    if (fileName) {
      const formatFileName = fileName.split("filename=")[1].split(";")[0];
      link.href = url;
      link.setAttribute("download", formatFileName);
      document.body.appendChild(link);
      link.click();
    }
  }, [checkedList]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-fit" disabled={checkedList.length === 0}>
          Options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => {
            setConfirmationDialog({
              isOpen: true,
              title: "Delete Statements",
              message: "Delete checked statements will delete its transactions too.",
              onConfirm: () => {
                deleteStatement(checkedList);
              },
            });
          }}>
          Delete
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadStatements}>Download</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StatementOptionDropdown;
