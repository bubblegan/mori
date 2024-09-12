import React from "react";
import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/ui/popover";
import { getExpenseFilterParam } from "@/utils/get-expense-filter-params";
import { sentenceCase } from "@/utils/sentence-case";
import { trpc } from "@/utils/trpc";
import { PlusCircleIcon } from "lucide-react";

const CategorySelect = () => {
  const categories = trpc.category.list.useQuery();
  const router = useRouter();

  if (categories.isFetching) return null;

  const { categoryIds, uncategorised } = getExpenseFilterParam();
  const params = new URLSearchParams(window.location.search);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="text-white">
          <div className="flex items-center gap-2">
            <PlusCircleIcon size={14} />
            Category
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="border-boder w-[180px] p-1" align="start">
        <div className="flex flex-col gap-1">
          {categories.data?.map((category) => {
            return (
              <div
                className="flex cursor-pointer items-center gap-4 rounded p-1 px-2 text-white hover:bg-secondary/50"
                key={category.id}>
                <Checkbox
                  checked={categoryIds.includes(category.id)}
                  onCheckedChange={() => {
                    let newCategoryIds = [];
                    if (!categoryIds.includes(category.id)) {
                      // check
                      newCategoryIds = categoryIds.length > 0 ? [...categoryIds, category.id] : [category.id];
                    } else {
                      // uncheck
                      newCategoryIds = categoryIds.filter((id) => id !== category.id);
                    }
                    if (newCategoryIds.length > 0) {
                      params.set("category-ids", newCategoryIds.join(","));
                    } else {
                      params.delete("category-ids");
                    }
                    router.push(`/expenses?${params.toString()}`, undefined, {
                      shallow: true,
                    });
                  }}
                  id={`${category.id}`}
                />
                <label htmlFor={`${category.id}`} className="w-32 text-sm">
                  {sentenceCase(category.title)}
                </label>
              </div>
            );
          })}
          <div
            className="flex cursor-pointer items-center gap-4 rounded p-1 px-2 text-white hover:bg-secondary/50"
            key={"uncategorise"}>
            <Checkbox
              checked={uncategorised}
              onCheckedChange={() => {
                if (uncategorised) {
                  // uncheck
                  params.delete("uncategorised");
                } else {
                  // check
                  params.set("uncategorised", "true");
                }
                router.push(`/expenses?${params.toString()}`, undefined, {
                  shallow: true,
                });
              }}
              id={"uncategorise"}
            />
            <label htmlFor={"uncategorise"} className="w-32 text-sm">
              Uncategorised
            </label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CategorySelect;
