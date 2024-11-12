import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import { Popover, PopoverContent } from "@/ui/popover";
import cn from "@/utils/cn";
import { DateRange as DateRangeType, dateRangeKeyConvert } from "@/utils/date-range-key";
import { PopoverTrigger } from "@radix-ui/react-popover";
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Input } from "../ui/input";

const DateRangePicker = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [startDateInput, setStartDateInput] = useState<string>("");
  const [endDateInput, setEndDateInput] = useState<string>("");

  const assignStateToParam = () => {
    const params = new URLSearchParams(window.location.search);
    if (showCustomDate && dateRange?.from && dateRange.to) {
      params.set("start-date", dayjs(dateRange?.from).format("YYYY-MM-DD"));
      params.set("end-date", dayjs(dateRange.to).format("YYYY-MM-DD"));
      params.delete("statement-ids");
    }

    router.push(`/expenses?${params.toString()}`, undefined, {
      shallow: true,
    });
  };

  useEffect(() => {
    const startDateParam = searchParams?.get("start-date");
    const endDateParam = searchParams?.get("end-date");

    const startDateParsed = dayjs(startDateParam, "YYYY-MM-DD");
    const endDateParsed = dayjs(endDateParam, "YYYY-MM-DD");

    if (startDateParsed.isValid() && endDateParsed.isValid()) {
      setDateRange({
        from: startDateParsed.toDate(),
        to: endDateParsed.toDate(),
      });
      setStartDateInput(startDateParsed.format("DD MMM, YYYY"));
      setEndDateInput(endDateParsed.format("DD MMM, YYYY"));
    }
  }, [searchParams]);

  const handleDateRangeClick = (dateRange: DateRangeType) => {
    const params = new URLSearchParams(window.location.search);
    params.delete("statement-ids");

    const [startDate, endDate] = dateRangeKeyConvert(dateRange);

    params.set("start-date", dayjs(startDate).format("YYYY-MM-DD"));
    params.set("end-date", dayjs(endDate).format("YYYY-MM-DD"));

    setDateRange({
      from: startDate,
      to: endDate,
    });

    setCalendarOpen(false);
    setShowCustomDate(false);

    router.push(`/expenses?${params.toString()}`, undefined, {
      shallow: true,
    });
  };

  const dateTitle = useMemo(() => {
    if (dateRange?.from && dateRange.to) {
      return `${dayjs(dateRange?.from).format("MMM DD, YYYY")} - ${dayjs(dateRange.to).format("MMM DD, YYYY")}`;
    }

    return "Pick a date";
  }, [dateRange]);

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "flex items-center gap-8 pl-3 text-left font-normal",
            !dateRange?.from && "text-muted-foreground"
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
          <Button
            variant="ghost"
            className="border-primary"
            onClick={() => handleDateRangeClick("year-to-date")}>
            Year To Date
          </Button>
          <Button variant="ghost" onClick={() => handleDateRangeClick("past-one-year")}>
            Past One year
          </Button>
          <Button variant="ghost" onClick={() => handleDateRangeClick("last-year")}>
            Last Year
          </Button>
          <Button variant="ghost" onClick={() => setShowCustomDate(true)}>
            Custom Date
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              setDateRange(undefined);
              params.delete("start-date");
              params.delete("end-date");
              router.push(`/expenses?${params.toString()}`, undefined, {
                shallow: true,
              });
              setCalendarOpen(false);
            }}>
            Reset
          </Button>
        </div>
        {showCustomDate && (
          <div className="flex w-[280px] flex-col items-center gap-2">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.to}
              selected={dateRange}
              onSelect={(dateRange) => {
                setDateRange(dateRange);
                setStartDateInput(dayjs(dateRange?.from).format("DD MMM, YYYY"));
                setEndDateInput(dayjs(dateRange?.to).format("DD MMM, YYYY"));
              }}
              disabled={{ after: new Date() }}
              numberOfMonths={1}
            />
            <div className="flex flex-row gap-2">
              <div className="flex flex-col gap-1">
                <label>Start</label>
                <Input
                  onChange={(e) => {
                    setStartDateInput(e.target.value);
                    if (dayjs(e.target.value).isValid() && e.target.value.length > 7) {
                      setDateRange({ to: dateRange?.to, from: dayjs(e.target.value).toDate() });
                    }
                  }}
                  value={startDateInput}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label>End</label>
                <Input
                  onChange={(e) => {
                    setEndDateInput(e.target.value);
                    if (dayjs(e.target.value).isValid() && e.target.value.length > 7) {
                      setDateRange({ to: dayjs(e.target.value).toDate(), from: dateRange?.from });
                    }
                  }}
                  value={endDateInput}
                />
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
