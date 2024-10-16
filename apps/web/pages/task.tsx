import { useCallback, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import BasePage from "@/components/base-page";
import TaskTable, { checkedTaskAtom } from "@/components/parsing-task-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import UploadSummary from "@/components/upload-summary";
import { completionToParsedDate, ParsedExpense, ParsedStatement } from "@/utils/completion-to-parsed-data";
import { trpc } from "@/utils/trpc";
import { Statement } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";

export default function Task() {
  const categories = trpc.category.list.useQuery();
  const { toast } = useToast();
  const router = useRouter();

  const [checkedList] = useAtom(checkedTaskAtom);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteKey, setDeleteKey] = useState<string>("");
  const [parsedExpense, setParsedExpense] = useState<ParsedExpense[]>([]);
  const [parsedStatement, setParsedStatement] = useState<ParsedStatement | undefined>(undefined);
  const [file, setFile] = useState<File | undefined>(undefined);

  const queryClient = useQueryClient();

  const insertParseDataToDb = useCallback(async () => {
    const response = await fetch("/api/task", {
      method: "PATCH",
      body: JSON.stringify({ id: checkedList }),
      headers: new Headers({
        "content-type": "application/json",
      }),
    });

    if (response.ok) {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  }, [checkedList, queryClient]);

  const deleteFromTask = useCallback(async () => {
    const response = await fetch("/api/task", {
      method: "DELETE",
      body: JSON.stringify({ id: checkedList }),
      headers: new Headers({
        "content-type": "application/json",
      }),
    });

    if (response.ok) {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  }, [checkedList, queryClient]);

  const onClick = async (key: string) => {
    const response = await fetch(`/api/task/${key}`, {
      method: "GET",
    });
    const resJson = await response.json();
    const [parsedStatement, parsedExpenses] = completionToParsedDate(
      resJson.completion,
      categories.data || []
    );
    setParsedExpense(parsedExpenses);
    setParsedStatement(parsedStatement);
    const uint8Array = new Uint8Array(resJson.file.data);
    const blob = new Blob([uint8Array], { type: "application/pdf" }); // You can adjust the MIME type accordingly
    const file = new File([blob], resJson.name, { type: "application/pdf" }); // Adjust the filename and MIME type
    setFile(file);
    setIsOpen(true);
    setDeleteKey(key);
  };

  return (
    <>
      <Head>
        <title>Uploaded</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BasePage>
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={checkedList.length === 0} variant="outline" className="w-fit">
                  Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={insertParseDataToDb}>Store</DropdownMenuItem>
                <DropdownMenuItem onClick={deleteFromTask}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex w-full flex-col gap-4">
              <TaskTable onPreviewClick={onClick} />
            </div>
          </div>
        </div>
        <Dialog open={isOpen}>
          <DialogContent
            onCloseClick={() => {
              setIsOpen(false);
            }}
            className="min-w-fit">
            <DialogHeader>
              <DialogTitle>Parsed Data</DialogTitle>
            </DialogHeader>
            <UploadSummary
              setParsedExpense={setParsedExpense}
              parsedExpenses={parsedExpense}
              parsedStatement={parsedStatement}
              onCreateClick={async () => {
                if (!file) return;
                const formData = new FormData();

                const statementPayload = {
                  bank: parsedStatement?.bank,
                  date: parsedStatement?.statementDate?.toISOString(),
                  expenses: parsedExpense.map((expense) => {
                    return {
                      description: expense.description,
                      amount: expense.amount,
                      date: expense.date,
                      ...(expense.categoryId ? { categoryId: expense.categoryId } : {}),
                    };
                  }),
                };

                formData.append("statement", file);
                formData.append("payload", JSON.stringify(statementPayload));
                formData.append("deletekey", deleteKey);

                const response = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                });

                if (response.ok) {
                  const statement = (await response.json()) as Statement;
                  toast({
                    description: "Statement Uploaded Successfully",
                    action: (
                      <ToastAction
                        onClick={() => {
                          router.push(`/expenses?statement-ids=${statement.id}`, undefined, {
                            shallow: true,
                          });
                        }}
                        altText="View">
                        View
                      </ToastAction>
                    ),
                  });
                  queryClient.invalidateQueries({ queryKey: ["tasks"] });
                  setIsOpen(false);
                  setFile(undefined);
                  setDeleteKey("");
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </BasePage>
    </>
  );
}
