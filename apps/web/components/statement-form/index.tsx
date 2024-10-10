import { useEffect, useMemo } from "react";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { trpc } from "@/utils/trpc";
import { atom, useAtom } from "jotai";
import { useForm, SubmitHandler } from "react-hook-form";

type StatementFormInput = {
  fileName: string;
};

export const StatementFormAtom = atom<{
  isOpen: boolean;
  statement?: { id: number; fileName: string };
}>({
  isOpen: false,
  statement: undefined,
});

const StatementForm = () => {
  const [value, setValue] = useAtom(StatementFormAtom);
  const { isOpen, statement } = value;
  const utils = trpc.useUtils();

  const form = useForm<StatementFormInput>({
    defaultValues: useMemo(() => {
      return {
        fileName: statement?.fileName,
      };
    }, [statement]),
  });

  useEffect(() => {
    form.reset({
      fileName: statement?.fileName,
    });
  }, [statement, form]);

  const { mutate: updateStatement } = trpc.statement.update.useMutation({
    onSuccess() {
      setValue({ isOpen: false, statement: undefined });
      utils.expense.invalidate();
    },
  });

  const onSubmit: SubmitHandler<StatementFormInput> = (data) => {
    updateStatement({
      id: Number(value.statement?.id),
      fileName: data.fileName,
    });
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent onCloseClick={() => setValue({ isOpen: false, statement: undefined })}>
        <DialogHeader>
          <DialogTitle>Expense</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="fileName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <Input className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-fit" type="submit">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StatementForm;
