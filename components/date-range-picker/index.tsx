import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import { Input } from "@/ui/input";
import { Popover, PopoverContent } from "@/ui/popover";
import cn from "@/utils/cn";
import { dateRangeTitleMap } from "@/utils/date-range-key";
import { PopoverTrigger } from "@radix-ui/react-popover";
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";

type DateRange = "YearToDate" | "LastMonth" | "LastYear" | "";

const DateRangePicker = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

  const assignStateToParam = () => {
    const params = new URLSearchParams(window.location.search);
    if (showCustomDate && startDate && endDate) {
      params.set("startDate", dayjs(startDate).format("YYYY-MM-DD"));
      params.set("endDate", dayjs(endDate).format("YYYY-MM-DD"));
      params.delete("dateRange");
      params.delete("statementIds");
    }

    router.push(`/expenses?${params.toString()}`, undefined, {
      shallow: true,
    });
  };

  useEffect(() => {
    const startDateParam = searchParams?.get("startDate");
    const endDateParam = searchParams?.get("endDate");

    const startDateParsed = dayjs(startDateParam, "YYYY-MM-DD");
    const endDateParsed = dayjs(endDateParam, "YYYY-MM-DD");

    if (startDateParsed.isValid() && endDateParsed.isValid()) {
      setStartDate(startDateParsed.toDate());
      setEndDate(endDateParsed.toDate());
    }
  }, [searchParams]);

  const handleDateRangeClick = (dateRange: DateRange) => {
    const params = new URLSearchParams(window.location.search);
    params.delete("startDate");
    params.delete("endDate");
    params.delete("statementIds");
    params.set("dateRange", dateRange);

    setCalendarOpen(false);
    setShowCustomDate(false);

    router.push(`/expenses?${params.toString()}`, undefined, {
      shallow: true,
    });
  };

  const dateTitle = useMemo(() => {
    const dateRangeParam = searchParams?.get("dateRange") as DateRange;

    if (dateRangeParam) {
      return dateRangeTitleMap[dateRangeParam];
    }

    if (startDate && endDate) {
      return `${dayjs(startDate).format("MMM DD, YYYY")} TO ${dayjs(endDate).format("MMM DD, YYYY")}`;
    }

    return "Pick a date";
  }, [searchParams, endDate, startDate]);

  const handleReset = () => {
    const params = new URLSearchParams(window.location.search);

    params.delete("startDate");
    params.delete("endDate");
    params.delete("dateRange");
    setCalendarOpen(false);

    router.push(`/expenses?${params.toString()}`, undefined, {
      shallow: true,
    });
  };

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "flex items-center gap-8 pl-3 text-left font-normal",
            !startDate && "text-muted-foreground"
          )}>
          {dateTitle}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onCloseAutoFocus={assignStateToParam}
        onFocusOutside={assignStateToParam}
        className="flex w-auto flex-row gap-6 p-4"
        align="start">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" onClick={() => handleDateRangeClick("YearToDate")}>
            Year To Date
          </Button>
          <Button variant="ghost" onClick={() => handleDateRangeClick("LastYear")}>
            Last Year
          </Button>
          <Button variant="ghost" onClick={() => handleDateRangeClick("LastMonth")}>
            Last Month
          </Button>
          <Button variant="ghost" onClick={() => setShowCustomDate(true)}>
            Custom Date
          </Button>
          <Button variant="ghost" onClick={() => handleReset()}>
            Reset
          </Button>
        </div>
        {showCustomDate && (
          <>
            <div className="flex flex-col gap-3">
              <Input value={dayjs(startDate).format("DD MMM YYYY")} readOnly />
              <Calendar
                mode="single"
                defaultMonth={startDate}
                selected={startDate}
                onSelect={setStartDate}
                className="p-0"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Input value={dayjs(endDate).format("DD MMM YYYY")} readOnly />
              <Calendar
                mode="single"
                defaultMonth={endDate}
                selected={endDate}
                onSelect={setEndDate}
                className="p-0"
              />
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
