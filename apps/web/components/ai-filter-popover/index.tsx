import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/ui/popover";
import { fetchFilterCompletion } from "@/utils/ai/fetch-completion";
import { formatCategoryIdByName } from "@/utils/format-categoryId-by-name";
import { trpc } from "@/utils/trpc";
import { LoaderIcon, Sparkles } from "lucide-react";

export function AiFilterPopover() {
  const [promptInput, setPromptInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [popOverOpen, setPopOverOpen] = useState(false);

  const categories = trpc.category.list.useQuery();

  const router = useRouter();

  const handleFilter = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);

      const filter = await fetchFilterCompletion(promptInput);

      // delete all params
      for (const key of params.keys()) {
        params.delete(key);
      }

      if (filter.startDate && filter.endDate) {
        params.set("start-date", filter.startDate);
        params.set("end-date", filter.endDate);
      }

      if (filter.keyword) {
        params.set("keyword", filter.keyword);
      }

      if (filter.category.length > 0) {
        const categoryIdByName = formatCategoryIdByName(categories.data || []);
        const ids = filter.category.map((category: string) => categoryIdByName && categoryIdByName[category]);
        params.set("category-ids", ids.join(","));
      }

      router.push(`/expenses?${params.toString()}`, undefined, {
        shallow: true,
      });
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
    setPopOverOpen(false);
  };

  return (
    <Popover open={popOverOpen} onOpenChange={setPopOverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Sparkles size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="border-boder flex h-fit w-fit flex-col items-end gap-2 p-2" align="end">
        <Input
          placeholder="Example: Show me expenses from last month"
          className="w-[420px]"
          value={promptInput}
          maxLength={200}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleFilter();
            }
          }}
        />
        <Button className="w-fit" disabled={isLoading} onClick={handleFilter}>
          {isLoading ? "Filtering" : "Filter"}{" "}
          {isLoading && <LoaderIcon className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
