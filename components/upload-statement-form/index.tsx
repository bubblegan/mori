import { ChangeEvent, useRef, useState } from "react";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Switch } from "@/ui/switch";
import { useToast } from "@/ui/use-toast";
import { trpc } from "@/utils/trpc";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";
import { ParsedResponse } from "../../pages/api/upload";
import UploadSummary from "./upload-summary";

type UploadingState = "default" | "uploading" | "uploaded";

const UploadStatementForm = ({
  isOpen = false,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (param: boolean) => void;
}) => {
  const { toast } = useToast();

  const [uploadingState, setUploadingState] = useState<UploadingState>("default");
  const [parsedData, setParsedData] = useState<ParsedResponse | null>(null);
  const [pdfFile, setPdfFile] = useState<FileList | null>(null);
  const [enableAiCategorise, setEnableAiCategorise] = useState(false);
  const [startUploadTime, setStartUploadTime] = useState<string | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const utils = trpc.useUtils();
  const logData = trpc.log.list.useQuery(
    { from: startUploadTime || "" },
    { enabled: !!startUploadTime, refetchInterval: 3000 }
  );

  const { mutate: createStatement } = trpc.statement.create.useMutation({
    onSuccess() {
      setIsOpen(false);
      toast({
        description: "Create Statement & Expenses Success",
      });
    },
  });

  let logMessage = "";

  if (logData.data) {
    logMessage = logData.data[logData.data?.length - 1]?.message;
  }

  const handleUpload = async () => {
    if (!pdfFile) return;

    const statement = pdfFile[0];
    const formData = new FormData();

    setStartUploadTime(new Date().toISOString());

    formData.append("statement", statement);

    if (enableAiCategorise) {
      formData.append("enableAiCategorise", "true");
    }

    setUploadingState("uploading");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const parsedData: ParsedResponse = await response.json();
      parsedData.statementDate = dayjs(parsedData.statementDate).toDate();
      parsedData.expenses.forEach((expense) => {
        expense.date = dayjs(expense.date).toDate();
        if (!expense.categoryId) {
          delete expense.categoryId;
        }
      });
      setParsedData(parsedData);
    }

    setUploadingState("uploaded");
    setPdfFile(null);
    setStartUploadTime(undefined);

    utils.statement.invalidate();
    utils.expense.invalidate();
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
                <p>{pdfFile[0].name}</p>
                <p>{pdfFile[0].size / 1000} KB</p>
              </div>
            )}
            <input
              type="file"
              ref={inputRef}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (!e.target.files) {
                  return;
                }
                setPdfFile(e.target.files);
              }}
              style={{ display: "none" }}
            />
            <div className="flex w-full justify-between rounded border border-gray-700 p-3">
              <p>Enable Ai Categorize</p>
              <Switch checked={enableAiCategorise} onCheckedChange={setEnableAiCategorise} />
            </div>
            <Button className="w-fit flex-row-reverse" onClick={handleUpload}>
              Upload
            </Button>
          </>
        )}
        {uploadingState === "uploading" && (
          <>
            <p>{logMessage}</p>
            <Button className="w-fit" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Statement Uploading
            </Button>
          </>
        )}
        {uploadingState === "uploaded" && (
          <UploadSummary
            parsedData={parsedData}
            onCreateClick={() => {
              if (parsedData) {
                createStatement(parsedData);
              }
            }}
            onCloseClick={() => {
              setIsOpen(false);
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
