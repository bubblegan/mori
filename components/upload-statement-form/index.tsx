import { useCallback, useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Switch } from "@/ui/switch";
import { trpc } from "@/utils/trpc";
import dayjs from "dayjs";
import { useDropzone } from "react-dropzone";
import generateCategorisePrompt from "../../server/ai/generateCategorisePrompt";
import generateParsingPrompt from "../../server/ai/generateParsingPrompt";
import { Progress } from "../ui/progress";
import { toast } from "../ui/use-toast";
import UploadSummary from "./upload-summary";
import { useCategoriseCompletion } from "./use-categorise-completion";
import { extractTextFromPDF } from "./use-extract-from-pdf";
import { useParsingCompletion } from "./use-parsing-completion";

export type UploadingState = "default" | "filepreview" | "reading" | "prompting" | "done";

export type ParsedExpense = {
  tempId: number;
  amount: number;
  date: Date;
  description: string;
  categoryTitle?: string;
  categoryId?: number;
};

export type ParsedStatement = {
  bank: string;
  statementDate: Date | null;
  totalAmount: number;
};

export type PromptingState = "parsing" | "categorise";

const UploadStatementForm = ({
  isOpen = false,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (param: boolean) => void;
}) => {
  const categories = trpc.category.list.useQuery();
  const categoriesMap: Record<number, string> = {};
  if (categories.data?.result) {
    categories.data?.result.forEach((category) => {
      categoriesMap[category.id] = category.title;
    });
  }

  const [uploadingState, setUploadingState] = useState<UploadingState>("default");
  const [startCategorise, setStartCategorise] = useState<boolean>(false);
  const [enableAiCategorise, setEnableAiCategorise] = useState(false);
  const [parsedExpense, setParsedExpense] = useState<ParsedExpense[]>([]);
  const [parsedStatement, setParsedStatement] = useState<ParsedStatement | undefined>(undefined);
  const [progress, setProgress] = useState({ percent: 0, text: "" });
  const [file, setFile] = useState<File | undefined>(undefined);

  const utils = trpc.useUtils();

  const { complete: completeCategorise } = useCategoriseCompletion((categorisedRecord) => {
    const parsedExpenseCategorised = parsedExpense.map((expense) => {
      if (!isNaN(expense.tempId) && categorisedRecord[expense.tempId]) {
        expense.categoryId = Number(categorisedRecord[expense.tempId]);
        expense.categoryTitle = categoriesMap[Number(categorisedRecord[expense.tempId])];
      }
      return expense;
    });
    setStartCategorise(false);
    setUploadingState("done");
    setParsedExpense(parsedExpenseCategorised);
  });

  const handleCategorise = (parsedExpenses: ParsedExpense[]) => {
    const uncategorisedExpense = parsedExpenses.filter((expense) => !expense.categoryId);
    const promptText = generateCategorisePrompt(uncategorisedExpense, categories.data?.result || []);
    completeCategorise(promptText);
  };

  const { complete: completeParsing } = useParsingCompletion(([parsedStatement, parsedExpenses]) => {
    setParsedStatement(parsedStatement);
    setParsedExpense(parsedExpenses);

    if (enableAiCategorise) {
      setStartCategorise(true);
    } else {
      setUploadingState("done");
    }
  });

  useEffect(() => {
    if (startCategorise) {
      handleCategorise(parsedExpense);
    }
  }, [startCategorise]);

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
    return;
  }, []);

  const handleParse = async () => {
    let prompt = "";
    if (file && file.type === "application/pdf") {
      setUploadingState("reading");
      const statementText = await extractTextFromPDF(file, (param) => {
        const [currPage, totalPage] = param;
        const percent = (currPage / totalPage) * 100;
        setProgress({ percent, text: `currently parsing ${currPage} of ${totalPage} page` });
      });
      prompt = generateParsingPrompt(statementText);
      setUploadingState("prompting");
      completeParsing(prompt);
    }

    if (file && file.type === "text/csv") {
      setStartCategorise(true);
      setUploadingState("prompting");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/csv": [".csv"],
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const handleUploadToDB = async () => {
    if (!file) return;

    const formData = new FormData();

    const statementPayload = {
      bank: parsedStatement?.bank,
      date: parsedStatement?.statementDate?.toISOString(),
      expenses: parsedExpense.map((expense) => {
        return {
          description: expense.description,
          amount: expense.amount,
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
      toast({ description: "uploaded successfully" });
      setIsOpen(false);
      setFile(undefined);
      setUploadingState("default");
    }
  };

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
              className="flex w-full cursor-pointer justify-center rounded border border-solid border-gray-700 p-4">
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
              <div className="flex w-full justify-between rounded border border-solid border-gray-700 p-4">
                <p>{file.name}</p>
                <p>{file.size / 1000} KB</p>
              </div>
            )}
            <div className="flex w-full justify-between rounded border border-gray-700 p-3">
              <p>Enable Ai Categorise</p>
              <Switch checked={enableAiCategorise} onCheckedChange={setEnableAiCategorise} />
            </div>
            <div className="flex flex-row-reverse">
              <Button className="w-fit" onClick={() => handleParse()}>
                Parse
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
            <p>{uploadingState}...</p>
          </>
        )}
        {uploadingState === "done" && (
          <UploadSummary
            parsedStatement={parsedStatement}
            parsedExpenses={parsedExpense}
            setParsedExpense={setParsedExpense}
            onCreateClick={() => {
              handleUploadToDB();
            }}
            onParseClick={
              !startCategorise
                ? () => {
                    handleCategorise(parsedExpense);
                  }
                : undefined
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadStatementForm;
