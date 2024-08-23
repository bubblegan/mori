import { useEffect, useMemo } from "react";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { trpc } from "@/utils/trpc";
import { Expense } from "@prisma/client";
import { atom, useAtom } from "jotai";
import { useForm, SubmitHandler } from "react-hook-form";

type ExpenseFormInput = {
  description: string;
  categoryId: string;
  note: string;
  amount: number;
};

export const ExpenseFormAtom = atom<{
  isOpen: boolean;
  expense?: Expense;
}>({
  isOpen: false,
  expense: undefined,
});

const ExpenseForm = () => {
  const [value, setValue] = useAtom(ExpenseFormAtom);
  const { isOpen, expense } = value;
  const utils = trpc.useUtils();

  const categories = trpc.category.list.useQuery();

  const form = useForm<ExpenseFormInput>({
    defaultValues: useMemo(() => {
      return {
        description: expense?.description,
        amount: Number(expense?.amount),
        categoryId: expense?.categoryId?.toString(),
        note: expense?.note || "",
      };
    }, [expense]),
  });

  useEffect(() => {
    form.reset({
      description: expense?.description,
      amount: Number(expense?.amount),
      categoryId: expense?.categoryId?.toString(),
      note: expense?.note || "",
    });
  }, [expense, form]);

  const { mutate: updateExpense } = trpc.expense.update.useMutation({
    onSuccess() {
      setValue({ isOpen: false, expense: undefined });
      utils.expense.invalidate();
    },
  });

  const onSubmit: SubmitHandler<ExpenseFormInput> = (data) => {
    updateExpense({
      id: Number(value.expense?.id),
      categoryId: Number(data.categoryId),
      description: data.description,
      amount: data.amount,
      note: data.note,
    });
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent onCloseClick={() => setValue({ isOpen: false, expense: undefined })}>
        <DialogHeader>
          <DialogTitle>Expense Form</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex w-full flex-row items-center gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input className="mt-1" {...field} value={isNaN(field.value) ? 0 : field.value} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="gap- h-10 w-full px-3 py-2">
                          <SelectValue className="mr-2 text-white" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent side="bottom">
                        {categories.data?.result?.map((category) => (
                          <SelectItem
                            className="text-neutral-200"
                            key={category.id}
                            value={category.id.toString()}>
                            {category.title[0].toLocaleUpperCase() + category.title.substring(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Input className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex w-full flex-row-reverse">
              <Button className="w-fit" type="submit">
                Submit
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;
