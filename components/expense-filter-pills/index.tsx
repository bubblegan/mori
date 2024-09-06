import { useRouter } from "next/router";
import { getExpenseFilterParam } from "@/utils/get-expense-filter-params";
import { trpc } from "@/utils/trpc";
import { X } from "lucide-react";

export function ExpenseFilterPills() {
  const router = useRouter();

  const categories = trpc.category.list.useQuery();
  const statements = trpc.statement.list.useQuery({});

  const { categoryIds, statementIds, uncategorised } = getExpenseFilterParam();

  const selectedCategory = categories.data?.filter((category) => categoryIds.includes(category.id)) || [];
  const selectedStatement = statements.data?.filter((statement) => statementIds.includes(statement.id)) || [];

  const removeFromParam = (param: string, id?: number) => {
    const params = new URLSearchParams(window.location.search);
    let filteredIds: number[] = [];

    if (param === "category-ids") {
      filteredIds = categoryIds.filter((categoryId) => categoryId !== id);
    }

    if (param === "statement-ids") {
      filteredIds = statementIds.filter((statementId) => statementId !== id);
    }

    if (filteredIds.length > 0) {
      params.set(param, filteredIds.join(","));
    } else {
      params.delete(param);
    }
    router.push(`/expenses?${params.toString()}`, undefined, {
      shallow: true,
    });
  };

  return (
    <div className="flex flex-row gap-2">
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
            className="flex cursor-pointer flex-row items-center gap-2 rounded-md px-3 py-2 text-xs"
            style={{ background: category.color }}>
            {category.title[0].toLocaleUpperCase() + category.title.substring(1)}
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
