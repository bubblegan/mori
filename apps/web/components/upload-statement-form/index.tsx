import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { trpc } from "@/utils/trpc";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { ToastAction } from "../ui/toast";
import { toast } from "../ui/use-toast";

export type UploadingState = "default" | "filepreview" | "done" | "error";

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

  const [errorText, setErrorText] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const statement = acceptedFiles[0];
    setFile(statement);
    setUploadingState("filepreview");
    return;
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onError: (error: Error) => {
      setUploadingState("error");
      setErrorText(error.message);
    },
    accept: {
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

                    // set error if response not ok

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
        {uploadingState === "done" && (
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
