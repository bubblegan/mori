import React from "react";
import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/ui/popover";
import { getExpenseFilterParam } from "@/utils/get-expense-filter-params";
import { trpc } from "@/utils/trpc";
import { PlusCircleIcon } from "lucide-react";

export function TagSelect() {
  const tags = trpc.tag.list.useQuery();
  const router = useRouter();

  if (tags.isFetching) return null;
  if (tags.data?.length === 0) return null;

  const { tagIds } = getExpenseFilterParam();
  const params = new URLSearchParams(window.location.search);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="text-white">
          <div className="flex items-center gap-2">
            <PlusCircleIcon size={14} />
            Tag
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="border--border w-[180px] p-1" align="start">
        <div className="flex flex-col gap-1">
          {tags.data?.map((tag) => {
            return (
              <div
                className="flex cursor-pointer items-center gap-4 rounded p-1 px-2 text-white hover:bg-secondary/50"
                key={tag.id}>
                <Checkbox
                  checked={tagIds.includes(tag.id)}
                  onCheckedChange={() => {
                    let newTagIds = [];
                    if (!tagIds.includes(tag.id)) {
                      // check
                      newTagIds = tagIds.length > 0 ? [...tagIds, tag.id] : [tag.id];
                    } else {
                      // uncheck
                      newTagIds = tagIds.filter((id) => id !== tag.id);
                    }
                    if (newTagIds.length > 0) {
                      params.set("tag-ids", newTagIds.join(","));
                    } else {
                      params.delete("tag-ids");
                    }
                    router.push(`/expenses?${params.toString()}`, undefined, {
                      shallow: true,
                    });
                  }}
                  id={`${tag.id}`}
                />
                <label htmlFor={`${tag.id}`} className="w-32 text-sm">
                  {tag.title[0].toLocaleUpperCase() + tag.title.substring(1)}
                </label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
