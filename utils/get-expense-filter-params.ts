import dayjs from "dayjs";
import { DateRange, dateRangeKeyConvert } from "./date-range-key";

export function getExpenseFilterParam() {
  const searchParams = typeof window == "undefined" ? undefined : new URLSearchParams(window.location.search);
  const statementIds = searchParams?.get("statementIds")?.split(",").map(Number) || [];
  const categoryIds = searchParams?.get("categoryIds")?.split(",").map(Number) || [];
  const keyword = searchParams?.get("keyword") || "";
  const startDate = searchParams?.get("startDate");
  const endDate = searchParams?.get("endDate");
  const dateRange = searchParams?.get("dateRange");
  const uncategorised = searchParams?.get("uncategorised") === "true";

  let start = null;
  let end = null;

  if (dateRange) {
    const [startDate, endDate] = dateRangeKeyConvert(dateRange as DateRange);
    start = dayjs(startDate).toISOString();
    end = dayjs(endDate).toISOString();
  }

  if (!startDate && endDate) {
    const startDateParsed = dayjs(startDate, "YYYY-MM-DD");
    const endDateParsed = dayjs(endDate, "YYYY-MM-DD");

    if (startDateParsed.isValid() && endDateParsed.isValid()) {
      start = dayjs(startDateParsed).toISOString();
      end = dayjs(endDateParsed).toISOString();
    }
  }

  return { statementIds, start, end, keyword, categoryIds, uncategorised };
}
