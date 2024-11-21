import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/ui/popover";
import { fetchFilterCompletion } from "@/utils/ai/fetch-completion";
import { trpc } from "@/utils/trpc";
import { LoaderIcon, Sparkles } from "lucide-react";
import { Input } from "../ui/input";

export function AiFilterPopover() {
  const [promptInput, setPromptInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [popOverOpen, setPopOverOpen] = useState(false);

  const categories = trpc.category.list.useQuery();

  const router = useRouter();

  const handleFilter = async () => {
    setIsLoading(true);

    const params = new URLSearchParams(window.location.search);
    const filter = await fetchFilterCompletion(promptInput);

    setIsLoading(false);

    if (filter.startDate && filter.endDate) {
      params.set("start-date", filter.startDate);
      params.set("end-date", filter.endDate);
    }

    if (filter.keyword) {
      params.set("keyword", filter.keyword);
    }

    if (filter.category.length > 0) {
      const categoryIdByName = categories.data?.reduce((byId: Record<string, number>, curr) => {
        byId[curr.title] = curr.id;
        return byId;
      }, {});

      const ids = filter.category.map((category: string) => categoryIdByName && categoryIdByName[category]);
      params.set("category-ids", ids.join(","));
    }

    router.push(`/expenses?${params.toString()}`, undefined, {
      shallow: true,
    });

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
          {isLoading ? "Prompting" : "Filter"}{" "}
          {isLoading && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
