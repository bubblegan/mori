export type DateRange = "YearToDate" | "LastMonth" | "LastYear";

const dateRangeKeyConvert = (dateRange: DateRange) => {
  const today = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (dateRange === "YearToDate") {
    startDate = new Date(today.getFullYear(), 0, 1);
    endDate = new Date();
  }

  if (dateRange === "LastYear") {
    startDate = new Date(today.getFullYear() - 1, 0, 1);
    endDate = new Date(today.getFullYear() - 1, 11, 31);
  }

  if (dateRange === "LastMonth") {
    const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate = new Date(firstDayThisMonth.getDate() - 1);
    endDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 0);

  return [startDate, endDate];
};

const dateRangeTitleMap: Record<DateRange, string> = {
  LastMonth: "LAST MONTH",
  YearToDate: "YEAR TO DATE",
  LastYear: "LAST YEAR",
};

export { dateRangeKeyConvert, dateRangeTitleMap };
