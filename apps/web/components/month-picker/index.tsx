import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import dayjs from "dayjs";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export function MonthPicker(props: { onMonthChange: (month: Date) => void; selectedMonth: Date }) {
  const { onMonthChange, selectedMonth } = props;
  const [selectedYear, setSelectedYear] = useState(selectedMonth.getFullYear());

  const changePrevOrNextMonth = (direction: "next" | "prev") => {
    if (direction === "next") {
      onMonthChange(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)));
    } else {
      onMonthChange(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)));
    }
  };

  const changeYear = (direction: "next" | "prev") => {
    if (direction === "next") {
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedYear(selectedYear - 1);
    }
  };

  return (
    <div className="flex flex-row gap-1">
      <Button variant="outline" onClick={() => changePrevOrNextMonth("prev")}>
        <ChevronLeft size={16} />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={"outline"} className={"w-[180px] pl-3 text-left font-normal"}>
            {selectedMonth ? dayjs(selectedMonth).format("MMM YYYY") : `Pick a date`}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto flex-col gap-2 p-2" align="start">
          <div className="flex flex-row items-center justify-between">
            <Button variant="outline" onClick={() => changeYear("prev")}>
              <ChevronLeft size={16} />
            </Button>
            <span>{selectedYear}</span>
            <Button variant="outline" onClick={() => changeYear("next")}>
              <ChevronRight size={16} />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, i) => {
              const current = new Date();
              current.setFullYear(selectedYear);
              current.setMonth(i);

              return (
                <Button
                  variant={"outline"}
                  key={i}
                  onClick={() => onMonthChange(current)}
                  className="w-full text-left">
                  {dayjs(current).format("MMM")}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="outline" onClick={() => changePrevOrNextMonth("next")}>
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
