import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import BasePage from "@/components/base-page";
import { MonthPicker } from "@/components/month-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/ui/select";
import { sentenceCase } from "@/utils/sentence-case";
import { trpc } from "@/utils/trpc";
import currency from "currency.js";
import dayjs from "dayjs";

type DailyExpense = { id: number; amount: number; color: string; description: string; categoryName: string };

export default function Calendar() {
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [view, setView] = useState("default");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const monthParam = searchParams?.get("month") || dayjs(new Date()).format("YYYY-MM");
    const view = searchParams?.get("view");

    if (monthParam) {
      setSelectedMonth(dayjs(monthParam).toDate());
    }

    if (view) {
      setView(view);
    }
  }, []);

  // get all days in array for this month in Date format
  const getDaysArray = (month: number, year: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  };

  const currentMonth = selectedMonth.getMonth();
  const currentYear = selectedMonth.getFullYear();

  // get first day of the month
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1);
  };

  // get last day of the month
  const getLastDayOfMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0);
  };

  const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
  const lastDayOfMonth = getLastDayOfMonth(currentMonth, currentYear);

  const expense = trpc.expense.list.useQuery({
    page: 1,
    per: 300,
    dateRange: {
      start: firstDayOfMonth,
      end: lastDayOfMonth,
    },
  });

  const expenses = expense.data?.result;

  const expensesByDate = expenses?.reduce((acc: Record<string, DailyExpense[]>, expense) => {
    const date = new Date(expense.date).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({
      id: expense.id,
      amount: Number(expense.amount),
      color: expense.Category?.color || "blue",
      categoryName: expense.Category?.title || "",
      description: expense.description,
    });
    return acc;
  }, {});

  if (view === "category") {
    for (const date in expensesByDate) {
      const groupedByCategory = expensesByDate[date].reduce(
        (acc: Record<string, DailyExpense[]>, expense) => {
          if (!acc[expense.categoryName]) {
            acc[expense.categoryName] = [];
          }
          acc[expense.categoryName].push(expense);
          return acc;
        },
        {}
      );

      // sum each groupedByCategory
      expensesByDate[date] = [];
      for (const category in groupedByCategory) {
        const total = groupedByCategory[category].reduce((acc, expense) => acc + expense.amount, 0);
        const color = groupedByCategory[category][0].color;
        const id = groupedByCategory[category][0].id;

        expensesByDate[date].push({
          id,
          amount: total,
          color,
          categoryName: category,
          description: sentenceCase(category),
        });
      }
    }
  }

  const daysArray = getDaysArray(currentMonth, currentYear);

  const formatDescription = (description: string) => {
    // limit description to 10 characters
    if (description.length > 10) {
      return `${description.slice(0, 10)}...`;
    }
    return description;
  };

  const onMonthChange = (monthSelected: Date) => {
    const params = new URLSearchParams(window.location.search);
    params.set("month", dayjs(monthSelected).format("YYYY-MM"));
    setSelectedMonth(monthSelected);
    router.push(`/calendar?${params.toString()}`, undefined, {
      shallow: true,
    });
  };

  return (
    <>
      <Head>
        <title>Statements</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BasePage>
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex w-full flex-row justify-between">
                <MonthPicker selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
                <Select
                  onValueChange={(value) => {
                    const params = new URLSearchParams(window.location.search);
                    if (value !== "default") {
                      params.set("view", value);
                    } else {
                      params.delete("view");
                    }
                    setView(value);
                    router.push(`/calendar?${params.toString()}`, undefined, {
                      shallow: true,
                    });
                  }}
                  defaultValue="default"
                  value={view}>
                  <SelectTrigger className="h-10 w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="category">By Category</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="grid grid-cols-7">
                  <div key={"sun"} className="text-center">
                    Sun
                  </div>
                  <div key={"mon"} className="text-center">
                    Mon
                  </div>
                  <div key={"tue"} className="text-center">
                    Tue
                  </div>
                  <div key={"web"} className="text-center">
                    Wed
                  </div>
                  <div key={"thu"} className="text-center">
                    Thu
                  </div>
                  <div key={"fri"} className="text-center">
                    Fri
                  </div>
                  <div key={"sat"} className="text-center">
                    Sat
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1">
                  {daysArray[0].getDay() < 7 &&
                    [...Array(daysArray[0].getDay())].map((_, i) => <div key={`${i}-offset`}>{null}</div>)}
                  {daysArray.map((date) => (
                    <div
                      key={date.toISOString()}
                      className="h-[150px] w-[180px] rounded border border-solid p-2 pt-2">
                      <span>{date.getDate()}</span>
                      <div className="flex flex-col gap-1">
                        {expensesByDate?.[date.toISOString().split("T")[0]]?.map((expense, index) => {
                          if (index > 3) {
                            return null;
                          }

                          if (index === 3) {
                            return (
                              <TooltipProvider key={expense.id}>
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-pointer pl-[0.5] text-xs" key={"extra"}>
                                      {" "}
                                      {expensesByDate?.[date.toISOString().split("T")[0]].length - 3} more
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="flex flex-col gap-1">
                                    {expensesByDate?.[date.toISOString().split("T")[0]].map(
                                      (expense, innerIndex) => {
                                        if (innerIndex < 3) {
                                          return null;
                                        }
                                        return (
                                          <div
                                            key={expense.id}
                                            style={{ backgroundColor: expense.color }}
                                            className="flex flex-row justify-between gap-6 rounded bg-blue-500 px-1 text-white">
                                            <span className="text-xs">{expense.description}</span>
                                            <span className="text-xs">
                                              {currency(Number(expense.amount)).format()}
                                            </span>
                                          </div>
                                        );
                                      }
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }

                          return (
                            <TooltipProvider key={expense.id}>
                              <Tooltip delayDuration={200}>
                                <TooltipTrigger>
                                  <div
                                    style={{ backgroundColor: expense.color }}
                                    className="flex flex-row justify-between rounded bg-blue-500 px-1 text-white">
                                    <span className="text-xs">{formatDescription(expense.description)}</span>
                                    <span className="text-xs">
                                      {currency(Number(expense.amount)).format()}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{expense.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </BasePage>
    </>
  );
}
