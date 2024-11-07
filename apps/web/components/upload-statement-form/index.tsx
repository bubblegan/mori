import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { ParsedExpense } from "@/utils/completion-to-parsed-data";
import { trpc } from "@/utils/trpc";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { ToastAction } from "../ui/toast";
import { toast } from "../ui/use-toast";
import UploadSummary from "../upload-summary";
import { handleCsvUpload } from "./handle-csv-upload";

export type UploadingState = "default" | "filepreview" | "error" | "csv";

const UploadStatementForm = ({
  isOpen = false,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (param: boolean) => void;
}) => {
  const categories = trpc.category.list.useQuery();
  const router = useRouter();
  const utils = trpc.useUtils();
  const categoriesMap: Record<string, number> = {};

  if (categories.data) {
    categories.data?.forEach((category) => {
      categoriesMap[category.title] = category.id;
    });
  }

  const [uploadingState, setUploadingState] = useState<UploadingState>("default");
  const [errorText, setErrorText] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);
  const [parsedExpense, setParsedExpense] = useState<ParsedExpense[]>([]);

  const { mutate: createExpenses } = trpc.expense.createMany.useMutation({
    onSuccess() {
      toast({ description: "Expenses Created." });
      utils.expense.invalidate();
      setIsOpen(false);
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const statement = acceptedFiles[0];
      if (statement.type === "application/pdf") {
        setFile(statement);
        setUploadingState("filepreview");
        return;
      }
      if (statement.type === "text/csv") {
        handleCsvUpload(statement, (parsedExpense) => {
          parsedExpense.forEach((expense) => {
            if (expense?.categoryTitle) {
              expense.categoryId = categoriesMap[expense?.categoryTitle];
            }
          });
          setParsedExpense(parsedExpense);
          setUploadingState("csv");
        });
        return;
      }
      return;
    },
    [categoriesMap]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onError: (error: Error) => {
      setUploadingState("error");
      setErrorText(error.message);
    },
    accept: {
      "application/pdf": [".pdf"],
      "application/zip": [".zip"],
      "application/csv": [".csv"],
    },
    multiple: false,
  });

  return (
    <Dialog open={isOpen}>
      <DialogContent
        onCloseClick={() => {
          setIsOpen(false);
          setFile(undefined);
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
              className="flex w-full cursor-pointer justify-center rounded border border-dashed border-border p-10">
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-5">
                <div className="rounded-full border border-dashed p-3">
                  <Upload size={24} />
                </div>
                {isDragActive ? (
                  <p>Drop the files here ...</p>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <p>Drag and drop some files here, or click to select files</p>
                    <p className="text-center text-sm text-muted-foreground/50">
                      You can upload single PDF or multiple in ZIP
                    </p>
                  </div>
                )}
              </div>
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
            <div className="flex flex-row-reverse">
              <Button
                className="w-fit"
                onClick={async () => {
                  if (file) {
                    const formData = new FormData();
                    formData.append("statement", file);

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
                      setUploadingState("default");
                    }
                  }
                }}>
                Upload
              </Button>
            </div>
          </>
        )}
        {uploadingState === "csv" && (
          <UploadSummary
            setParsedExpense={setParsedExpense}
            parsedExpenses={parsedExpense}
            onCreateClick={() => {
              const expenses = parsedExpense.map((expense) => {
                return {
                  description: expense.description,
                  amount: expense.amount,
                  date: expense.date,
                  ...(expense.categoryId ? { categoryId: expense.categoryId } : {}),
                };
              });
              createExpenses(expenses);
            }}
          />
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
                }}>
                Back
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadStatementForm;
