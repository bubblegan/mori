import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/ui/popover";
import { trpc } from "@/utils/trpc";
import { PlusCircleIcon } from "lucide-react";

const StatementYearSelect = () => {
  const statements = trpc.statement.list.useQuery({});
  const years = trpc.statement.years.useQuery();

  const router = useRouter();
  let results: string[] = years && years.data ? years.data?.map((item) => item.years) : [];

  if (!statements.isFetched) return null;

  if (statements.data) {
    const years = new Set(
      statements.data?.map((statement) => {
        const statementDate = new Date(statement.date);
        return statementDate.getFullYear().toString();
      }) || []
    );
    results = Array.from(years);
  }

  const params = new URLSearchParams(window.location.search);
  let yearsParam = params.get("years")?.split(",") || [];

  const selectedStatement = results?.filter((year) => yearsParam.includes(year));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="text-white">
          <div className="flex items-center gap-2">
            <PlusCircleIcon size={14} />
            Year
            {selectedStatement && selectedStatement?.length > 0 && (
              <div className="mx-1 h-3 border-l border-slate-600" />
            )}
            {selectedStatement && selectedStatement?.length < 3 ? (
              selectedStatement?.map((statement) => (
                <div key={statement} className="rounded-md bg-slate-600 p-1 text-xs">
                  {statement}
                </div>
              ))
            ) : (
              <div className="rounded-md bg-slate-600 p-1 text-xs">{selectedStatement?.length} selected</div>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] border-slate-700 p-1" align="start">
        <div className="flex flex-col gap-1">
          {results?.map((year) => {
            return (
              <div
                className="flex cursor-pointer items-center gap-4 rounded p-1 px-2 text-white hover:bg-slate-800"
                key={year}>
                <Checkbox
                  checked={yearsParam.includes(year)}
                  onCheckedChange={() => {
                    if (!yearsParam.includes(year)) {
                      // check
                      yearsParam = yearsParam.length > 0 ? [...yearsParam, year] : [year];
                    } else {
                      yearsParam = yearsParam.filter((yearParam) => yearParam !== year);
                    }
                    if (yearsParam.length > 0) {
                      params.set("years", yearsParam.join(","));
                    } else {
                      params.delete("years");
                    }
                    router.push(`/statements?${params.toString()}`, undefined, {
                      shallow: true,
                    });
                  }}
                  id={`${year}`}
                />
                <label htmlFor={`${year}`} className="w-32">
                  {year}
                </label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default StatementYearSelect;
