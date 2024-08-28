import { useEffect, useState } from "react";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { trpc } from "@/utils/trpc";
import dayjs from "dayjs";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

export function CategoryExpenseChart() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);

  useEffect(() => {
    const yearNum = Number(year);

    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 0);

    const startDateParsed = dayjs(startDate, "YYYY-MM-DD").toISOString();
    const endDateParsed = dayjs(endDate, "YYYY-MM-DD").toISOString();

    setDateRange([startDateParsed, endDateParsed]);
  }, [year]);

  const distinctYear = trpc.expense.distinctYear.useQuery();

  let yearOptions: number[] = [];
  if (distinctYear.isFetched) {
    yearOptions = distinctYear.data?.map((item) => Number(item.year)) || [];
  }

  const categories = trpc.expense.aggregateByCategory.useQuery({
    startDate: dateRange[0],
    endDate: dateRange[1],
  });

  const chartConfig: Record<string, { label: string; color: string }> = {} satisfies ChartConfig;

  const chartData = categories.data?.map((category) => {
    const title = category.title || "uncategorise";

    chartConfig[title] = {
      label: title,
      color: category.color || "",
    };

    return {
      name: title,
      value: Number(category.sum),
      fill: category.color,
    };
  });

  return (
    <div className="flex flex-col items-end gap-4">
      <Select onValueChange={(value) => setYear(value)} defaultValue={"2024"} value={year}>
        <SelectTrigger className="h-8 w-fit border-neutral-500">
          <SelectValue className="mr-2 text-white" />
        </SelectTrigger>
        <SelectContent side="bottom">
          {yearOptions.map((year) => {
            let yearTitle = year.toString();

            if (new Date().getFullYear() === year) {
              yearTitle = "Year to date";
            }

            return (
              <SelectItem className="text-neutral-200" key={year} value={year.toString()}>
                {yearTitle}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <ChartContainer config={chartConfig} className="min-h-[100px] w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{
            left: 0,
          }}>
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label}
          />
          <XAxis dataKey="value" type="number" hide />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="value" layout="vertical" radius={5} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
