import { useEffect } from "react";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import { trpc } from "@/utils/trpc";
import { Category } from "@prisma/client";
import { atom, useAtom } from "jotai";
import { useForm, SubmitHandler } from "react-hook-form";

type CategoryFormInput = {
  title: string;
  keyword: string;
  color: string;
};

export const CategoryFormAtom = atom<{
  isOpen: boolean;
  category?: Category;
}>({
  isOpen: false,
  category: undefined,
});

const CategoryForm = () => {
  const [value, setValue] = useAtom(CategoryFormAtom);
  const { isOpen, category } = value;

  const form = useForm<CategoryFormInput>();

  useEffect(() => {
    const keyword = Array.isArray(category?.keyword) ? category?.keyword?.join(",") : "";

    form.reset({
      title: category?.title,
      color: category?.color,
      keyword,
    });
  }, [category, form]);

  const colorOptions: string[] = [
    "#44403c",
    "#b91c1c",
    "#c2410c",
    "#4d7c0f",
    "#15803d",
    "#047857",
    "#0e7490",
    "#0f766e",
    "#1d4ed8",
    "#4338ca",
    "#6d28d9",
    "#a21caf",
    "#be185d",
    "#be123c",
  ];

  const utils = trpc.useUtils();

  const { mutate: createCategory } = trpc.category.create.useMutation({
    onSuccess() {
      setValue({ isOpen: false });
      utils.category.invalidate();
    },
  });

  const { mutate: updateCategory } = trpc.category.update.useMutation({
    onSuccess() {
      setValue({ isOpen: false });
      utils.category.invalidate();
    },
  });

  const onSubmit: SubmitHandler<CategoryFormInput> = (data) => {
    const keywordArr = data.keyword.split(",");
    if (category) {
      updateCategory({
        id: category.id,
        title: data.title.toLocaleLowerCase(),
        color: data.color,
        keyword: keywordArr,
      });
    } else {
      createCategory({
        title: data.title.toLocaleLowerCase(),
        color: data.color,
        keyword: keywordArr,
      });
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent onCloseClick={() => setValue({ isOpen: false })}>
        <DialogHeader>
          <DialogTitle>Category</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="title" className="text-white">
                Title
              </label>
              <Input className="mt-1 text-white" {...form.register("title")} />
            </div>
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colors</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-8 w-32 border-neutral-500">
                        <SelectValue className="mr-2 h-8 w-32 text-white">
                          <div className="mr-2 h-6 w-16 text-white" style={{ background: field.value }} />
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent side="bottom" className="w-fit">
                      <SelectGroup className="max-h-48 overflow-y-auto">
                        {colorOptions.map((color) => {
                          return (
                            <SelectItem
                              className="h-9 w-32"
                              style={{ backgroundColor: color }}
                              key={color}
                              value={color}
                            />
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="title" className="text-white">
                Keyword
              </label>
              <Textarea className="mt-1 text-white" {...form.register("keyword")} />
            </div>
            <Button className="w-fit" type="submit">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;
