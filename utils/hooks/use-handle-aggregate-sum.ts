import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { DateRange, dateRangeKeyConvert } from "../date-range-key";
import { trpc } from "../trpc";

export function useHandleAggregateSum() {
  const searchParams = useSearchParams();
  const statementIds = searchParams?.get("statementIds")?.split(",").map(Number) || [];
  const startDate = searchParams?.get("startDate");
  const endDate = searchParams?.get("endDate");
  const dateRange = searchParams?.get("dateRange");

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

  const expenses = trpc.category.aggregate.useQuery({
    statementIds,
    dateRange: {
      start,
      end,
    },
  });

  return expenses;
}
