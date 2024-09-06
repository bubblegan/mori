import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/ui/popover";
import { trpc } from "@/utils/trpc";
import { PlusCircleIcon } from "lucide-react";
import { StatementAggregate } from "../../server/routers/statement";

const StatementSelect = () => {
  const statements = trpc.statement.list.useQuery({});
  const router = useRouter();

  if (!statements.isFetched) return null;

  const grouped: Record<number, StatementAggregate[]> =
    statements.data?.reduce((byYear: Record<number, StatementAggregate[]>, statement) => {
      const year = statement.date.getFullYear();
      if (!byYear[year]) {
        byYear[year] = [];
      }
      byYear[year].push(statement);
      return byYear;
    }, {}) || {};

  const params = new URLSearchParams(window.location.search);
  let statementIds = params.get("statement-ids")?.split(",") || [];

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
          {Object.keys(grouped).map((key) => {
            const statements = grouped[Number(key)];

            return (
              <Popover key={key}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-white">
                    <div className="flex items-center">{key}</div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="mt-6 w-[180px] border-slate-700 p-1" sideOffset={10} side="right">
                  {statements?.map((statement) => {
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
                              params.set("statement-ids", statementIds.join(","));
                            } else {
                              params.delete("statement-ids");
                            }
                            params.delete("date-range");
                            params.delete("start-date");
                            params.delete("end-date");
                            router.push(`/expenses?${params.toString()}`, undefined, {
                              shallow: true,
                            });
                          }}
                          id={`${statement.id}`}
                        />
                        <label htmlFor={`${statement.id}`} className="w-32 text-sm">
                          {statement.name}
                        </label>
                      </div>
                    );
                  })}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default StatementSelect;
