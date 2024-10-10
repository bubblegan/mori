import { AggregateSummaryChart } from "@/components/aggregate-summary-chart";
import { AggregateSummaryTable } from "@/components/aggregate-summary-table";

export function ExpenseSummarySection() {
  return (
    <div className="flex flex-row gap-8">
      <div className="flex flex-col gap-4">
        <AggregateSummaryChart aggregateBy="category" />
        <AggregateSummaryTable aggregateBy="category" />
      </div>
      <div className="flex flex-col gap-4">
        <AggregateSummaryChart aggregateBy="monthly" />
        <AggregateSummaryTable aggregateBy="monthly" />
      </div>
    </div>
  );
}
