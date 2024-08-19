import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/ui/popover";
import { trpc } from "@/utils/trpc";
import { PlusCircleIcon } from "lucide-react";

const StatementSelect = () => {
  const statements = trpc.statement.list.useQuery({});
  const router = useRouter();
  let results;

  if (statements.isFetching) return null;

  if (statements.data && "result" in statements.data) {
    results = statements.data?.result;
  }

  const params = new URLSearchParams(window.location.search);
  let statementIds = params.get("statementIds")?.split(",") || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="text-white">
          <div className="flex items-center gap-2">
            <PlusCircleIcon size={14} />
            Statement
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] border-slate-700 p-1" align="start">
        <div className="flex flex-col gap-1">
          {results?.map((statement) => {
            return (
              <div
                className="flex cursor-pointer items-center gap-4 rounded p-1 px-2 text-white hover:bg-slate-800"
                key={statement.id}>
                <Checkbox
                  checked={statementIds.includes(statement.id.toString())}
                  onCheckedChange={() => {
                    if (!statementIds.includes(statement.id.toString())) {
                      // check
                      statementIds =
                        statementIds.length > 0
                          ? [...statementIds, statement.id.toString()]
                          : [statement.id.toString()];
                    } else {
                      statementIds = statementIds.filter((id) => id !== statement.id.toString());
                    }
                    if (statementIds.length > 0) {
                      params.set("statementIds", statementIds.join(","));
                    } else {
                      params.delete("statementIds");
                    }
                    router.push(`/expenses?${params.toString()}`, undefined, {
                      shallow: true,
                    });
                  }}
                  id={`${statement.id}`}
                />
                <label htmlFor={`${statement.id}`} className="w-32">
                  {statement.name}
                </label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default StatementSelect;
