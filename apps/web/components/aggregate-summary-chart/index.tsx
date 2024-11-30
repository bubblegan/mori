import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import cn from "@/utils/cn";
import { useHandleCategoryAggregate } from "@/utils/hooks/use-handle-category-aggregate";
import { useHandleMonthAggregate } from "@/utils/hooks/use-handle-monthly-aggregate";
import { sentenceCase } from "@/utils/sentence-case";
import dayjs from "dayjs";

export function AggregateSummaryChart(props: { aggregateBy: "monthly" | "category" }) {
  const { aggregateBy } = props;

  // get data here
  const aggregateCategories = useHandleCategoryAggregate();
  const monthly = useHandleMonthAggregate();

  const data = useMemo(() => {
    const monthColor = [
      "#a6cee3",
      "#1f78b4",
      "#b2df8a",
      "#33a02c",
      "#fb9a99",
      "#e31a1c",
      "#fdbf6f",
      "#ff7f00",
      "#cab2d6",
      "#6a3d9a",
      "#ffff99",
      "#b15928",
    ];

    if (aggregateBy === "category") {
      const total = aggregateCategories.data?.map((category) => {
        return {
          title: category.title,
          amount: Number(category.amount),
          color: category.color,
        };
      });

      return total?.sort((a, b) => b.amount - a.amount);
    }

    if (aggregateBy === "monthly") {
      return monthly.data?.map((month, index) => {
        return {
          title: dayjs(month.title).format("MMM YYYY"),
          amount: Number(month.amount),
          color: monthColor[index],
        };
      });
    }
  }, [aggregateCategories, monthly, aggregateBy]);

  const totalAmount =
    data?.reduce((acc, currVal) => {
      return acc + currVal.amount;
    }, 0) || 1;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">{sentenceCase(aggregateBy)} :</span>
      <div className="flex w-[600px] flex-row gap-[2px]">
        <TooltipProvider>
          {data?.map((item, index) => {
            const width = (item.amount / totalAmount) * 800;
            return (
              <Tooltip delayDuration={200} key={item.title}>
                <TooltipTrigger asChild>
                  <div
                    style={{ width, backgroundColor: item.color }}
                    className={cn(
                      "h-7",
                      index === 0 && "rounded-bl-md rounded-tl-md",
                      index === data.length - 1 && "rounded-br-md rounded-tr-md"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {sentenceCase(item.title)} : $ {item.amount}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
