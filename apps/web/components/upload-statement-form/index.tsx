import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Switch } from "@/ui/switch";
import { completionToCategorise } from "@/utils/completion-to-categorise";
import { completionToParsedDate, ParsedExpense, ParsedStatement } from "@/utils/completion-to-parsed-data";
import { fetchCompletion } from "@/utils/fetch-completion";
import { sentenceCase } from "@/utils/sentence-case";
import { trpc } from "@/utils/trpc";
import { Statement } from "@prisma/client";
import dayjs from "dayjs";
import { useDropzone } from "react-dropzone";
import { generateCategorisePrompt } from "../../server/ai/generate-categorise-prompt";
import { generateParsingPrompt } from "../../server/ai/generate-parsing-prompt";
import { Progress } from "../ui/progress";
import { Textarea } from "../ui/textarea";
import { ToastAction } from "../ui/toast";
import { toast } from "../ui/use-toast";
import UploadSummary from "./upload-summary";
import { extractTextFromPDF } from "./use-extract-from-pdf";

export type UploadingState =
  | "default"
  | "filepreview"
  | "reading"
  | "promptpreview"
  | "prompting"
  | "done"
  | "error";

const UploadStatementForm = ({
  isOpen = false,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (param: boolean) => void;
}) => {
  const categories = trpc.category.list.useQuery();
  const router = useRouter();
  const categoriesMap: Record<number, string> = {};
  if (categories.data) {
    categories.data?.forEach((category) => {
      categoriesMap[category.id] = category.title;
    });
  }

  const [uploadingState, setUploadingState] = useState<UploadingState>("default");

  const [promptPreview, setPromptPreview] = useState(false);
  const [promptText, setPromptText] = useState("");

  const [parsedExpense, setParsedExpense] = useState<ParsedExpense[]>([]);
  const [parsedStatement, setParsedStatement] = useState<ParsedStatement | undefined>(undefined);

  const [progress, setProgress] = useState({ percent: 0, text: "" });
  const [errorText, setErrorText] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);

  const utils = trpc.useUtils();

  const handleCategorise = async (expenseParam: ParsedExpense[]) => {
    const uncategorisedExpense = expenseParam.filter((expense) => !expense.categoryId);
    const categorisePrompt = generateCategorisePrompt(uncategorisedExpense, categories.data || []);
    const completion = await fetchCompletion(categorisePrompt);
    const categoryMap = completionToCategorise(completion);
    const parsedExpenseCategorised = expenseParam.map((expense) => {
      if (!isNaN(expense.tempId) && categoryMap[expense.tempId]) {
        expense.categoryId = Number(categoryMap[expense.tempId]);
        expense.categoryTitle = categoriesMap[Number(categoryMap[expense.tempId])];
      }
      return expense;
    });
    return parsedExpenseCategorised;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Do something with the files
    const statement = acceptedFiles[0];
    setFile(statement);

    if (statement.type === "text/csv") {
      const reader = new FileReader();
      const expenseCsvList: ParsedExpense[] = [];
      reader.onload = (e) => {
        const text = e?.target?.result;
        if (typeof text === "string" || text instanceof String) {
          const rows = text.split("\n");
          const parsedData = rows.map((row) => {
            row = row.replace("\r", "").trim();
            return row.split(",");
          });

          // check header
          const headers = parsedData[0];
          const validHeader = ["description", "amount", "category", "date"];
          const csvHeader: string[] = [];
          headers.forEach((header) => {
            if (validHeader.includes(header)) {
              csvHeader.push(header);
            } else {
              csvHeader.push("");
            }
          });

          if (parsedData.length > 1) {
            for (let i = 1; i < parsedData.length; i++) {
              const expenseCsv: ParsedExpense = {
                tempId: i,
                amount: 0,
                date: new Date(),
                description: "",
              };
              parsedData[i].forEach((data, index) => {
                const headerType = csvHeader[index];
                if (headerType === "description") {
                  expenseCsv.description = data;
                }
                if (headerType === "amount") {
                  const amount = Number(data);
                  if (!isNaN(amount)) {
                    expenseCsv.amount = amount;
                  }
                }
                if (headerType === "date") {
                  const date = dayjs(data);
                  if (date.isValid()) {
                    expenseCsv.date = date.toDate();
                  }
                }
              });
              expenseCsvList.push(expenseCsv);
            }
          }

          setParsedExpense(expenseCsvList);
          setUploadingState("done");
        }
      };
      reader.readAsText(statement);
    }

    if (statement.type === "application/pdf") {
      setUploadingState("filepreview");
    }

    if (statement.type === "application/zip") {
      const formData = new FormData();
      formData.append("statement", statement);

      const response = await fetch("/api/task", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          description: "Uploaded to background process",
          action: (
            <ToastAction
              onClick={() => {
                router.push("/task");
              }}
              altText="View">
              View
            </ToastAction>
          ),
        });
        setFile(undefined);
        setIsOpen(false);
        setParsedStatement(undefined);
        setUploadingState("default");
      }
    }
    return;
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onError: (error: Error) => {
      setUploadingState("error");
      setErrorText(error.message);
    },
    accept: {
      "text/csv": [".csv"],
      "application/csv": [".csv"],
      "application/pdf": [".pdf"],
      "application/zip": [".zip"],
    },
    multiple: false,
  });

  return (
    <Dialog open={isOpen}>
      <DialogContent
        onCloseClick={() => {
          setIsOpen(false);
          setFile(undefined);
          setParsedStatement(undefined);
          setUploadingState("default");
        }}
        className="min-w-fit">
        <DialogHeader>
          <DialogTitle>Upload Statement</DialogTitle>
        </DialogHeader>
        {uploadingState === "default" && (
          <>
            <div
              {...getRootProps()}
              className="flex w-full cursor-pointer justify-center rounded border border-solid border-border p-4">
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <p>Drag and drop some files here, or click to select files</p>
              )}
            </div>
          </>
        )}
        {uploadingState === "filepreview" && (
          <>
            {file && (
              <div className="flex w-full justify-between rounded border border-solid border-border p-4">
                <p>{file.name}</p>
                <p>{file.size / 1000} KB</p>
              </div>
            )}
            <div className="flex w-full justify-between rounded border border-border p-3">
              <p>Show Prompt Preview</p>
              <Switch checked={promptPreview} onCheckedChange={setPromptPreview} />
            </div>
            <div className="flex flex-row-reverse">
              <Button
                className="w-fit"
                onClick={async () => {
                  if (file && file.type === "application/pdf") {
                    setUploadingState("reading");
                    let statementText = "";
                    try {
                      statementText = await extractTextFromPDF(file, (param) => {
                        const [currPage, totalPage] = param;
                        const percent = (currPage / totalPage) * 100;
                        setProgress({ percent, text: `Currently reading ${currPage} of ${totalPage} page` });
                      });
                    } catch (error) {
                      setUploadingState("error");
                      setErrorText("OCR error");
                    }
                    setUploadingState("prompting");
                    const parsingPrompt = generateParsingPrompt(statementText, categories.data || []);
                    if (promptPreview) {
                      setPromptText(parsingPrompt);
                      setUploadingState("promptpreview");
                      return;
                    }
                    const completion = await fetchCompletion(parsingPrompt);
                    const [parsedStatement, parsedExpenses] = completionToParsedDate(
                      completion,
                      categories.data || []
                    );
                    setParsedExpense(parsedExpenses);
                    setParsedStatement(parsedStatement);
                    setUploadingState("done");
                  }

                  if (file && file.type === "text/csv") {
                    handleCategorise(parsedExpense);
                    setUploadingState("prompting");
                  }
                }}>
                AI Parsing
              </Button>
            </div>
          </>
        )}
        {uploadingState === "promptpreview" && (
          <>
            <Textarea className="mt-1 h-52 text-white" value={promptText} />
            <div className="flex flex-row-reverse">
              <Button
                className="w-fit"
                onClick={() => {
                  setUploadingState("default");
                  setFile(undefined);
                  setParsedExpense([]);
                  setParsedStatement(undefined);
                }}>
                Start Parsing
              </Button>
            </div>
          </>
        )}
        {uploadingState === "error" && (
          <>
            <p>{errorText}</p>
            <div className="flex flex-row-reverse">
              <Button
                className="w-fit"
                onClick={() => {
                  setUploadingState("default");
                  setFile(undefined);
                  setParsedExpense([]);
                  setParsedStatement(undefined);
                }}>
                Back
              </Button>
            </div>
          </>
        )}
        {uploadingState === "reading" && (
          <div className="flex flex-col gap-2">
            <p>{progress.text}...</p>
            <Progress value={progress.percent} />
          </div>
        )}
        {uploadingState === "prompting" && (
          <>
            <p>{sentenceCase(uploadingState)}...</p>
          </>
        )}
        {uploadingState === "done" && (
          <UploadSummary
            parsedStatement={parsedStatement}
            parsedExpenses={parsedExpense}
            setParsedExpense={setParsedExpense}
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

              const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });

              utils.statement.invalidate();
              utils.expense.invalidate();

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
                setIsOpen(false);
                setFile(undefined);
                setUploadingState("default");
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadStatementForm;
