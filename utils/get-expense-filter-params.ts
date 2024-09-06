import dayjs from "dayjs";
import { DateRange, dateRangeKeyConvert } from "./date-range-key";
import { convertToISO } from "./date-util";

export function getExpenseFilterParam() {
  const searchParams = typeof window == "undefined" ? undefined : new URLSearchParams(window.location.search);

  const statementIds = searchParams?.get("statement-ids")?.split(",").map(Number) || [];
  const categoryIds = searchParams?.get("category-ids")?.split(",").map(Number) || [];
  const keyword = searchParams?.get("keyword") || "";
  const startDate = searchParams?.get("start-date");
  const endDate = searchParams?.get("end-date");
  const dateRange = searchParams?.get("date-range");
  const uncategorised = searchParams?.get("uncategorised") === "true";

  let start = null;
  let end = null;

  if (dateRange) {
    const [startDate, endDate] = dateRangeKeyConvert(dateRange as DateRange);
    start = convertToISO(startDate);
    end = convertToISO(endDate);
  }

  if (startDate && endDate) {
    const startDateParsed = dayjs(startDate, "YYYY-MM-DD");
    const endDateParsed = dayjs(endDate, "YYYY-MM-DD");

    if (startDateParsed.isValid() && endDateParsed.isValid()) {
      start = dayjs(startDateParsed).toISOString();
      end = dayjs(endDateParsed).toISOString();
    }
  }

  return { statementIds, start, end, keyword, categoryIds, uncategorised };
}
