import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { atom, useAtom } from "jotai";

export const ConfirmationDialogAtom = atom<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}>({
  isOpen: false,
  title: "",
  message: "",
  onConfirm: () => null,
});

export function ConfirmationDialog() {
  const [value, setValue] = useAtom(ConfirmationDialogAtom);

  return (
    <AlertDialog open={value.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{value.title}</AlertDialogTitle>
          <AlertDialogDescription>{value.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => setValue({ isOpen: false, title: "", message: "", onConfirm: () => null })}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={value.onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
