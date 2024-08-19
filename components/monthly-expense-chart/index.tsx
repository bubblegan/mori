import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { trpc } from "@/utils/trpc";
import dayjs from "dayjs";
import { Bar, BarChart, XAxis, CartesianGrid } from "recharts";

export function MonthlyExpenseChart() {
  const expenses = trpc.expense.aggregateByYear.useQuery({ year: 2023 });
  const data =
    expenses.data?.reduce((acc: { [key: string]: number }, curr) => {
      acc[dayjs(curr.month).month()] = Number(curr.sum);
      return acc;
    }, {}) ?? {};

  const chartData = [];
  for (const month of Array(6).keys()) {
    chartData.push({
      name: dayjs().month(month).format("MMM"),
      total: data[month] || 0,
    });
  }

  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col items-end gap-4">
      <Select defaultValue={"2024"} value={"2024"}>
        <SelectTrigger className="h-8 w-fit border-neutral-500">
          <SelectValue className="mr-2 text-white">{2024}</SelectValue>
        </SelectTrigger>
        <SelectContent side="bottom">
          <SelectItem className="text-neutral-200" key={2024} value={"2024"}>
            {2024}
          </SelectItem>
        </SelectContent>
      </Select>
      <ChartContainer config={chartConfig} className="min-h-[100px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="total" fill="var(--color-desktop)" radius={8} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
