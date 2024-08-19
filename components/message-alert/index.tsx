import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";
import { atom, useAtom } from "jotai";

export const MessageAlertAtom = atom<{
  isOpen: boolean;
  mesasge: string;
  title: string;
}>({
  isOpen: false,
  title: "",
  mesasge: "",
});

const MessageAlert = () => {
  const [value, setValue] = useAtom(MessageAlertAtom);

  return (
    <AlertDialog open={value.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upload Success</AlertDialogTitle>
          <AlertDialogDescription>{value.mesasge}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setValue({ isOpen: false, mesasge: "", title: "" })}>
            Okay
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MessageAlert;
