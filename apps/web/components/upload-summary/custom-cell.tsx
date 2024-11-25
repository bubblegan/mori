import { useState, useEffect, ChangeEvent } from "react";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { formatToDisplayDate } from "@/utils/date-util";
import { sentenceCase } from "@/utils/sentence-case";
import { trpc } from "@/utils/trpc";
import { CellContext } from "@tanstack/react-table";
import currency from "currency.js";
import { ParsedExpenseTable } from ".";

const CustomCell = ({
  getValue,
  table,
  cell,
  column,
  row,
}: CellContext<ParsedExpenseTable, string | number | undefined>) => {
  const initialValue = getValue();
  const tableMeta = table.options.meta as {
    editCellId: string;
    updateData: (rowIndex: number, columnName: string, newValue: string | number) => void;
  };
  const columnMeta = column.columnDef.meta;
  const [value, setValue] = useState(initialValue);
  const categories = trpc.category.list.useQuery();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = (e: ChangeEvent<HTMLInputElement>) => {
    if (columnMeta?.editField) {
      tableMeta.updateData(Number(row.id), columnMeta?.editField, e.target.value);
    }
  };

  const onSelect = (value: string) => {
    if (columnMeta?.editField) {
      tableMeta.updateData(Number(row.id), columnMeta?.editField, value);
    }
  };

  if (tableMeta?.editCellId === cell.id) {
    if (columnMeta?.type === "number" || columnMeta?.type === "text") {
      return (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          type={columnMeta?.type}
        />
      );
    }

    if (columnMeta?.type === "select") {
      return (
        <Select onValueChange={onSelect} value={value?.toString()}>
          <SelectTrigger className="gap- h-10 w-full px-3 py-2">
            <SelectValue className="mr-2" />
          </SelectTrigger>
          <SelectContent side="bottom">
            {categories.data?.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {sentenceCase(category.title)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
  }

  if (columnMeta?.type === "number") {
    return (
      <div className="flex justify-between">
        $<div className="pr-8 text-right">{currency(value as string).format({ symbol: "" })}</div>
      </div>
    );
  }

  if (columnMeta?.type === "date") {
    const dateString = formatToDisplayDate(value);
    return <span>{dateString}</span>;
  }

  if (column.id === "category") {
    const category = categories.data?.find((cat) => cat.id === value);
    if (category) return <span>{sentenceCase(category.title)}</span>;
  }

  return <span>{value}</span>;
};

export default CustomCell;
