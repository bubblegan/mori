import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { DateRange, dateRangeKeyConvert } from "../dateRangeKey";
import { trpc } from "../trpc";

const useHandleExpenseFetch = () => {
  const searchParams = useSearchParams();
  const statementIds = searchParams.get("statementIds")?.split(",").map(Number) || [];
  const categoryIds = searchParams.get("categoryIds")?.split(",").map(Number) || [];
  const keyword = searchParams.get("keyword") || "";
  const dateRange = searchParams.get("dateRange");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  let start = null;
  let end = null;

  if (dateRange) {
    const [startDate, endDate] = dateRangeKeyConvert(dateRange as DateRange);
    start = dayjs(startDate).toISOString();
    end = dayjs(endDate).toISOString();
  }

  if (!dateRange && startDate && endDate) {
    const startDateParsed = dayjs(startDate, "YYYY-MM-DD");
    const endDateParsed = dayjs(endDate, "YYYY-MM-DD");

    if (startDateParsed.isValid() && endDateParsed.isValid()) {
      start = dayjs(startDateParsed).toISOString();
      end = dayjs(endDateParsed).toISOString();
    }
  }
  const expenses = trpc.expense.list.useQuery({
    statementIds,
    dateRange: {
      start,
      end,
    },
    keyword,
    categoryIds,
  });

  return expenses;
};

export default useHandleExpenseFetch;
