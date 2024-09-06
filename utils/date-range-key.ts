export type DateRange = "year-to-date" | "last-month" | "last-year" | "past-one-year" | "";

export function dateRangeKeyConvert(dateRange: DateRange) {
  const today = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (dateRange === "year-to-date") {
    startDate = new Date(today.getFullYear(), 0, 1);
    endDate = new Date();
  }

  if (dateRange === "past-one-year") {
    startDate = new Date(today.getFullYear() - 1, 0, 1);
    endDate = new Date();
  }

  if (dateRange === "last-year") {
    startDate = new Date(today.getFullYear() - 1, 0, 1);
    endDate = new Date(today.getFullYear() - 1, 11, 31);
  }

  if (dateRange === "last-month") {
    const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate = new Date(firstDayThisMonth.getDate() - 1);
    endDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 0);

  return [startDate, endDate];
}

export const dateRangeTitleMap: Record<DateRange, string> = {
  ["last-month"]: "Last Month",
  ["year-to-date"]: "Year To Date",
  ["past-one-year"]: "Past One Year",
  ["last-year"]: "Last Year",
  [""]: "None",
};
