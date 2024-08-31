import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Switch } from "@/ui/switch";
import { trpc } from "@/utils/trpc";
import dayjs from "dayjs";
import generateCategorisePrompt from "../../server/ai/generateCategorisePrompt";
import generateParsingPrompt from "../../server/ai/generateParsingPrompt";
import { toast } from "../ui/use-toast";
import extractTextFromPDF from "./extract-from-pdf";
import UploadSummary from "./upload-summary";
import { useCategoriseCompletion } from "./use-categorise-completion";
import { useParsingCompletion } from "./use-parsing-completion";

export type UploadingState = "default" | "reading" | "prompting" | "done";

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
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    setUploadingState("reading");
    const statement = e.target.files[0];
    let prompt = "";

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

          if (enableAiCategorise) {
            setStartCategorise(true);
            setUploadingState("prompting");
          } else {
            setUploadingState("done");
          }
        }
      };
      reader.readAsText(statement);
      setPdfFile(statement);
    }

    if (statement.type === "application/pdf") {
      const statementText = await extractTextFromPDF(statement);
      prompt = generateParsingPrompt(statementText);
      setUploadingState("prompting");
      completeParsing(prompt);
    }

    return;
  };

  const handleUpload = async () => {
    if (!pdfFile) return;

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

    formData.append("statement", pdfFile);
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
      setPdfFile(null);
      setUploadingState("default");
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        onCloseClick={() => {
          setIsOpen(false);
          setPdfFile(null);
        }}
        className="min-w-fit">
        <DialogHeader>
          <DialogTitle>Upload Statement</DialogTitle>
        </DialogHeader>
        {uploadingState === "default" && (
          <>
            <div
              onClick={() => {
                inputRef.current?.click();
              }}
              className="flex w-full cursor-pointer justify-center rounded border border-solid border-gray-700 p-4">
              <p>Click here to upload</p>
            </div>
            {pdfFile && (
              <div className="flex w-full justify-between rounded border border-solid border-gray-700 p-4">
                <p>{pdfFile.name}</p>
                <p>{pdfFile.size / 1000} KB</p>
              </div>
            )}
            <input type="file" ref={inputRef} onChange={handleFileUpload} style={{ display: "none" }} />
            <div className="flex w-full justify-between rounded border border-gray-700 p-3">
              <p>Enable Ai Categorise</p>
              <Switch checked={enableAiCategorise} onCheckedChange={setEnableAiCategorise} />
            </div>
            <Button onClick={() => handleUpload()}>Upload</Button>
          </>
        )}
        {(uploadingState === "prompting" || uploadingState === "reading") && (
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
              handleUpload();
            }}
            onCloseClick={() => {
              setIsOpen(false);
              setPdfFile(null);
              setUploadingState("default");
            }}
            onDownloadCsvClick={() => {
              console.log("todo");
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadStatementForm;
