import { ChangeEvent, useRef, useState } from "react";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Switch } from "@/ui/switch";
import { trpc } from "@/utils/trpc";
import generateParsingPrompt from "../../server/ai/generateParsingPrompt";
import { toast } from "../ui/use-toast";
import extractTextFromPDF from "./extract-from-pdf";
import UploadSummary from "./upload-summary";
import { useParsingCompletion } from "./use-parsing-completion";

export type UploadingState = "default" | "reading" | "prompting" | "done";

export type ParsedExpense = {
  tempId: number;
  amount: number;
  date: Date;
  description: string;
  categoryName?: string;
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
  const [uploadingState, setUploadingState] = useState<UploadingState>("default");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const utils = trpc.useUtils();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    complete,
    parsedStatement,
    parsedExpense,
    setEnableAiCategorise,
    enableAiCategorise,
    setParsedExpense,
  } = useParsingCompletion(setUploadingState);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    setUploadingState("reading");
    const statement = e.target.files[0];

    // for pdf statements
    const statementText = await extractTextFromPDF(statement);
    const prompt = generateParsingPrompt(statementText);

    setPdfFile(statement);
    setUploadingState("prompting");

    complete(prompt);
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
