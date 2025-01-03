import { useState, useEffect } from "react";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import cn from "@/utils/cn";
import { formatToDisplayDate } from "@/utils/date-util";
import { CellContext } from "@tanstack/react-table";
import { CalendarIcon } from "lucide-react";
import { ParsedExpenseTable } from ".";

const DateCell = ({
  getValue,
  table,
  cell,
  column,
  row,
}: CellContext<ParsedExpenseTable, Date | string | undefined>) => {
  const initialValue = getValue();
  const tableMeta = table.options.meta as {
    editCellId: string;
    updateData: (rowIndex: number, columnName: string, newValue: string | number | Date) => void;
  };
  const columnMeta = column.columnDef.meta;
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onSelect = (value: Date | undefined) => {
    setValue(value);
    if (columnMeta?.editField && value) {
      tableMeta.updateData(Number(row.id), columnMeta?.editField, value);
    }
  };

  if (tableMeta?.editCellId === cell.id && value instanceof Date) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[180px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatToDisplayDate(value) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={value} onSelect={onSelect} initialFocus />
        </PopoverContent>
      </Popover>
    );
  }

  const dateString = formatToDisplayDate(value);

  return <span>{dateString}</span>;
};

export default DateCell;
