import { useEffect } from "react";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form } from "@/ui/form";
import { Input } from "@/ui/input";
import { trpc } from "@/utils/trpc";
import { Tag } from "@prisma/client";
import { atom, useAtom } from "jotai";
import { useForm, SubmitHandler } from "react-hook-form";

type TagFormInput = {
  title: string;
};

export const TagFormAtom = atom<{
  isOpen: boolean;
  tag?: Tag;
}>({
  isOpen: false,
  tag: undefined,
});

const TagForm = () => {
  const [value, setValue] = useAtom(TagFormAtom);
  const { isOpen, tag } = value;

  const form = useForm<TagFormInput>();

  useEffect(() => {
    form.reset({
      title: tag?.title,
    });
  }, [tag, form]);

  const utils = trpc.useUtils();

  const { mutate: createTag } = trpc.tag.create.useMutation({
    onSuccess() {
      setValue({ isOpen: false });
      utils.tag.invalidate();
    },
  });

  const { mutate: updateTag } = trpc.tag.update.useMutation({
    onSuccess() {
      setValue({ isOpen: false });
      utils.tag.invalidate();
    },
  });

  const onSubmit: SubmitHandler<TagFormInput> = (data) => {
    if (tag) {
      updateTag({
        id: tag.id,
        title: data.title.toLocaleLowerCase(),
      });
    } else {
      createTag({
        title: data.title.toLocaleLowerCase(),
      });
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent onCloseClick={() => setValue({ isOpen: false })}>
        <DialogHeader>
          <DialogTitle>Tag</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="title">Title</label>
              <Input className="mt-1" {...form.register("title")} />
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

export default TagForm;
