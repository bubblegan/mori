import { useRouter } from "next/router";
import { getExpenseFilterParam } from "@/utils/get-expense-filter-params";
import { sentenceCase } from "@/utils/sentence-case";
import { trpc } from "@/utils/trpc";
import { X } from "lucide-react";

export function ExpenseFilterPills() {
  const router = useRouter();

  const categories = trpc.category.list.useQuery();
  const statements = trpc.statement.list.useQuery({});
  const tags = trpc.tag.list.useQuery();

  const { categoryIds, statementIds, uncategorised, tagIds } = getExpenseFilterParam();

  const selectedCategory = categories.data?.filter((category) => categoryIds.includes(category.id)) || [];
  const selectedStatement = statements.data?.filter((statement) => statementIds.includes(statement.id)) || [];
  const selectedTag = tags.data?.filter((tag) => tagIds.includes(tag.id)) || [];

  const removeFromParam = (param: string, id?: number) => {
    const params = new URLSearchParams(window.location.search);
    let filteredIds: number[] = [];

    if (param === "category-ids") {
      filteredIds = categoryIds.filter((categoryId) => categoryId !== id);
    }

    if (param === "statement-ids") {
      filteredIds = statementIds.filter((statementId) => statementId !== id);
    }

    if (param === "tag-ids") {
      filteredIds = tagIds.filter((tagId) => tagId !== id);
    }

    if (filteredIds.length > 0) {
      params.set(param, filteredIds.join(","));
    } else {
      params.delete(param);
    }

    if (params.toString().length === 0) {
      router.push(`/expenses`, undefined, {
        shallow: true,
      });
      return;
    }

    router.push(`/expenses?${params.toString()}`, undefined, {
      shallow: true,
    });
  };

  if (
    !uncategorised &&
    selectedCategory.length === 0 &&
    selectedTag.length === 0 &&
    selectedStatement.length === 0
  ) {
    return null;
  }

  return (
    <div className="flex h-10 w-fit flex-row gap-2 rounded-md border border-input px-3 py-2">
      {uncategorised && (
        <div
          onClick={() => removeFromParam("uncategorised")}
          className="flex cursor-pointer flex-row items-center gap-2 rounded-md bg-slate-500 px-3 py-2 text-xs">
          Uncategorised
          <X size={14} />
        </div>
      )}
      {selectedCategory?.map((category) => {
        return (
          <div
            key={category.id}
            onClick={() => removeFromParam("category-ids", category.id)}
            className="flex cursor-pointer flex-row items-center gap-2 rounded-md px-3 py-2 text-xs text-white"
            style={{ background: category.color }}>
            {sentenceCase(category.title)}
            <X size={14} />
          </div>
        );
      })}
      {selectedTag?.map((tag) => {
        return (
          <div
            key={tag.id}
            onClick={() => removeFromParam("tag-ids", tag.id)}
            className="flex cursor-pointer flex-row items-center gap-2 rounded-md bg-orange-400 px-3 py-2 text-xs">
            {sentenceCase(tag.title)}
            <X size={14} />
          </div>
        );
      })}
      {selectedStatement?.map((statement) => {
        return (
          <div
            key={statement.id}
            onClick={() => removeFromParam("statement-ids", statement.id)}
            className="flex cursor-pointer flex-row items-center gap-2 rounded-md bg-green-800 px-3 py-2 text-xs">
            {statement.name}
            <X size={14} />
          </div>
        );
      })}
    </div>
  );
}
