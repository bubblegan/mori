import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { trpc } from "@/utils/trpc";
import { X } from "lucide-react";

export function ExpenseFilterPills() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categories = trpc.category.list.useQuery();
  const statements = trpc.statement.list.useQuery({});

  const categoryIds = searchParams?.get("category-ids")?.split(",") || [];
  const statementIds = searchParams?.get("statement-ids")?.split(",") || [];

  const selectedCategory =
    categories.data?.result?.filter((category) => categoryIds.includes(category.id.toString())) || [];

  const selectedStatement = statements.data?.result?.filter((statement) =>
    statementIds.includes(statement.id.toString())
  );

  const removeFromParam = (param: string, id: number) => {
    const params = new URLSearchParams(window.location.search);
    let filteredIds: string[] = [];

    if (param === "category-ids") {
      filteredIds = categoryIds.filter((categoryId) => categoryId !== id.toString());
    }

    if (param === "statement-ids") {
      filteredIds = statementIds.filter((statementId) => statementId !== id.toString());
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
