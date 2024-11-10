import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/ui/form";
import { Input } from "@/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/ui/popover";
import { Textarea } from "@/ui/textarea";
import { trpc } from "@/utils/trpc";
import { Category } from "@prisma/client";
import { atom, useAtom } from "jotai";
import { HexColorPicker } from "react-colorful";
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
  const [initialColor, setInitialColor] = useState<string | undefined>("");
  const { isOpen, category } = value;

  const form = useForm<CategoryFormInput>();

  useEffect(() => {
    const keyword = Array.isArray(category?.keyword) ? category?.keyword?.join(",") : "";
    setInitialColor(category?.color);
    form.reset({
      title: category?.title,
      color: category?.color,
      keyword,
    });
  }, [category, form]);

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
              <label htmlFor="title" className="text-primary">
                Title
              </label>
              <Input className="mt-1 text-primary" {...form.register("title")} />
            </div>
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <Popover>
                    <FormControl>
                      <PopoverTrigger asChild>
                        <Button variant="outline">
                          <div className="flex items-center gap-2">
                            Color{" "}
                            <div
                              className="w-fit rounded-md px-3 py-0.5 capitalize text-white"
                              style={{ background: field.value }}>
                              {form.getValues("title")}
                            </div>{" "}
                          </div>
                        </Button>
                      </PopoverTrigger>
                    </FormControl>
                    <PopoverContent
                      className="border-boder flex h-fit w-fit flex-col gap-2 p-2"
                      align="start">
                      <HexColorPicker color={field.value} onChange={field.onChange} />
                      <Button className="w-fit" onClick={() => field.onChange(initialColor)}>
                        Reset
                      </Button>
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="title">Keyword</label>
              <Textarea className="mt-1" {...form.register("keyword")} />
            </div>
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

export default CategoryForm;
