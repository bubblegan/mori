import dayjs from "dayjs";

export function getExpenseFilterParam() {
  const searchParams = typeof window == "undefined" ? undefined : new URLSearchParams(window.location.search);

  const statementIds = searchParams?.get("statement-ids")?.split(",").map(Number) || [];
  const categoryIds = searchParams?.get("category-ids")?.split(",").map(Number) || [];
  const tagIds = searchParams?.get("tag-ids")?.split(",").map(Number) || [];
  const keyword = searchParams?.get("keyword") || "";
  const startDate = searchParams?.get("start-date");
  const endDate = searchParams?.get("end-date");
  const uncategorised = searchParams?.get("uncategorised") === "true";

  let start = null;
  let end = null;

  if (startDate && endDate) {
    const startDateParsed = dayjs(startDate, "YYYY-MM-DD");
    const endDateParsed = dayjs(endDate, "YYYY-MM-DD");

    if (startDateParsed.isValid() && endDateParsed.isValid()) {
      start = dayjs(startDateParsed).toDate();
      end = dayjs(endDateParsed).toDate();
    }
  }

  return { statementIds, start, end, keyword, categoryIds, uncategorised, tagIds };
}
