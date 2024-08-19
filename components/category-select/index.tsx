import React from "react";
import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/ui/popover";
import { trpc } from "@/utils/trpc";
import { PlusCircleIcon } from "lucide-react";

const CategorySelect = () => {
  const categories = trpc.category.list.useQuery();
  const router = useRouter();

  if (categories.isFetching) return null;

  const params = new URLSearchParams(window.location.search);
  let categoryIds = params.get("categoryIds")?.split(",") || [];

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
      <PopoverContent className="w-[180px] border-slate-700 p-1" align="start">
        <div className="flex flex-col gap-1">
          {categories.data?.result?.map((category) => {
            return (
              <div
                className="flex cursor-pointer items-center gap-4 rounded p-1 px-2 text-white hover:bg-slate-800"
                key={category.id}>
                <Checkbox
                  checked={categoryIds.includes(category.id.toString())}
                  onCheckedChange={() => {
                    if (!categoryIds.includes(category.id.toString())) {
                      // check
                      categoryIds =
                        categoryIds.length > 0
                          ? [...categoryIds, category.id.toString()]
                          : [category.id.toString()];
                    } else {
                      // uncheck
                      categoryIds = categoryIds.filter((id) => id !== category.id.toString());
                    }
                    if (categoryIds.length > 0) {
                      params.set("categoryIds", categoryIds.join(","));
                    } else {
                      params.delete("categoryIds");
                    }
                    router.push(`/expenses?${params.toString()}`, undefined, {
                      shallow: true,
                    });
                  }}
                  id={`${category.id}`}
                />
                <label htmlFor={`${category.id}`} className="w-32">
                  {category.title}
                </label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CategorySelect;
