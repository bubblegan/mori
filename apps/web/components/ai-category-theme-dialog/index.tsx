import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { toast } from "@/ui/use-toast";
import { fetchThemeCompletion } from "@/utils/ai/fetch-completion";
import { formatCategoryIdByName } from "@/utils/format-categoryId-by-name";
import { trpc } from "@/utils/trpc";
import { LoaderIcon } from "lucide-react";

export function AiCategoryThemeDialog(props: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void }) {
  const { isOpen, setIsOpen } = props;
  const categories = trpc.category.list.useQuery();
  const utils = trpc.useUtils();

  const categoryIdByName = formatCategoryIdByName(categories.data || []);

  const [promptInput, setPromptInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [themeAvailabled, setIsThemeAvailabled] = useState(false);
  const [categoriesColor, setCategoriesColor] = useState<{ title: string; color: string }[]>([]);

  useEffect(() => {
    setCategoriesColor(
      categories.data?.map((category) => ({
        id: category.id,
        title: category.title,
        color: category.color,
      })) || []
    );
  }, [categories.data]);

  // mutation to update category colour
  const { mutate: updateCategories } = trpc.category.updateCategoryColor.useMutation({
    onSuccess() {
      toast({ description: "Theme changed successfully" });
      utils.category.invalidate();
      setIsOpen(false);
    },
  });

  const handleFetchingTheme = async () => {
    setIsLoading(true);
    try {
      const colour = await fetchThemeCompletion(
        promptInput,
        categories.data?.map((category) => ({
          title: category.title,
          color: category.color,
        })) || []
      );
      setCategoriesColor(colour.colourList);
      setIsThemeAvailabled(true);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent onCloseClick={() => setIsOpen(false)}>
        <DialogHeader>
          <DialogTitle>Ai Theme Editor</DialogTitle>
        </DialogHeader>
        <div className="flex w-[400px] flex-row flex-wrap gap-2">
          {categoriesColor.map((category) => {
            return (
              <div
                className="w-fit rounded-md px-3 py-0.5 capitalize text-white"
                style={{ background: category.color }}
                key={category.title}>
                {category.title}
              </div>
            );
          })}
        </div>
        <Input
          placeholder="Example: Change my colour to different shades of red"
          className="w-full"
          value={promptInput}
          disabled={isLoading}
          maxLength={200}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleFetchingTheme();
            }
          }}
        />
        <div className="flex w-full flex-row-reverse gap-2">
          <Button className="w-fit" disabled={isLoading} onClick={handleFetchingTheme}>
            {isLoading ? "Getting Yur Theme" : "Prompt"}{" "}
            {isLoading && <LoaderIcon className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
          {themeAvailabled && (
            <Button
              onClick={() => {
                const payload = categoriesColor.map((category) => ({
                  id: categoryIdByName[category.title],
                  color: category.color,
                }));

                updateCategories(payload);
              }}>
              Change to Theme
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
