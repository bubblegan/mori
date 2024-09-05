import { useMemo } from "react";
import { useHandleCategoryAggregate } from "@/utils/hooks/use-handle-category-aggregate";
import { useHandleMonthAggregate } from "@/utils/hooks/use-handle-monthly-aggregate";
import { AggregateType } from "../../pages/expenses";

export function AggregateSummaryChart(props: { aggregateBy: AggregateType }) {
  const { aggregateBy } = props;

  // get data here
  const aggregateCategories = useHandleCategoryAggregate();
  const monthly = useHandleMonthAggregate();

  const data = useMemo(() => {
    if (aggregateBy === "category") {
      return aggregateCategories.data?.map((category) => {
        return {
          title: category.title,
          amount: Number(category.amount),
        };
      });
    }

    if (aggregateBy === "monthly") {
      return monthly.data?.map((month) => {
        return {
          title: month.title,
          amount: Number(month.amount),
        };
      });
    }
  }, [aggregateCategories, monthly, aggregateBy]);

  const totalAmount =
    data?.reduce((acc, currVal) => {
      return acc + currVal.amount;
    }, 0) || 1;

  return (
    <div className="flex w-[800px] flex-row gap-[2px]">
      {data?.map((item) => {
        const width = (item.amount / totalAmount) * 800;
        return <div style={{ width }} key={item.title} className="h-7 bg-yellow-600" />;
      })}
    </div>
  );
}
