import { useEffect, useMemo } from "react";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import { Checkbox } from "@/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import cn from "@/utils/cn";
import { trpc } from "@/utils/trpc";
import { Expense } from "@prisma/client";
import dayjs from "dayjs";
import { atom, useAtom } from "jotai";
import { CalendarIcon } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";

type ExpenseFormInput = {
  description: string;
  categoryId: string;
  note: string;
  amount: number;
  date: Date;
  tags: number[];
};

export const ExpenseFormAtom = atom<{
  isOpen: boolean;
  expense?: Expense & { tags: number[] };
}>({
  isOpen: false,
  expense: undefined,
});

const ExpenseForm = () => {
  const [value, setValue] = useAtom(ExpenseFormAtom);
  const { isOpen, expense } = value;
  const utils = trpc.useUtils();
  const categories = trpc.category.list.useQuery();
  const tags = trpc.tag.list.useQuery();

  const form = useForm<ExpenseFormInput>({
    defaultValues: useMemo(() => {
      return {
        description: expense?.description,
        amount: Number(expense?.amount),
        categoryId: expense?.categoryId?.toString(),
        note: expense?.note || "",
        date: expense?.date,
        tags: expense?.tags || [],
      };
    }, [expense]),
  });

  useEffect(() => {
    form.reset({
      description: expense?.description,
      amount: Number(expense?.amount),
      categoryId: expense?.categoryId?.toString(),
      note: expense?.note || "",
      date: expense?.date,
      tags: expense?.tags || [],
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
      date: data.date.toISOString(),
      tags: data.tags,
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
                name="date"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                            {field.value ? (
                              dayjs(field.value).format("DD MMM YYYY")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          defaultMonth={field.value}
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex w-full flex-row items-center gap-4">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Tag</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className="w-full">
                            Tags
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex flex-col gap-1">
                          {tags.data?.result?.map((tag) => {
                            return (
                              <div
                                className="flex cursor-pointer items-center gap-4 rounded p-1 px-2 text-white hover:bg-slate-800"
                                key={tag.id}>
                                <Checkbox
                                  checked={field.value?.includes(tag.id)}
                                  onCheckedChange={() => {
                                    let tagIds: number[] = [];
                                    if (!field.value?.includes(tag.id)) {
                                      // check
                                      tagIds = field.value?.length > 0 ? [...field.value, tag.id] : [tag.id];
                                    } else {
                                      // uncheck
                                      tagIds = field.value?.filter((id) => id !== tag.id);
                                    }

                                    field.onChange(tagIds);
                                  }}
                                  id={`${tag.id}`}
                                />
                                <label htmlFor={`${tag.id}`} className="w-32">
                                  {tag.title}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
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
