import { ParsedExpense } from "@/utils/completion-to-parsed-data";
import currency from "currency.js";
import dayjs from "dayjs";

export function handleCsvUpload(csvFile: File, onFinishParse: (parsedExpense: ParsedExpense[]) => undefined) {
  const reader = new FileReader();
  const expenseCsvList: ParsedExpense[] = [];
  reader.onload = (e) => {
    const text = e?.target?.result;
    if (typeof text === "string" || text instanceof String) {
      const rows = text.split("\n");
      const parsedData = rows.map((row) => {
        row = row.replace("\r", "").trim();
        return row.split(",");
      });

      const headers = parsedData[0];
      const validHeader = ["description", "amount", "category", "date"];
      const csvHeader: string[] = [];
      headers.forEach((header) => {
        if (validHeader.includes(header)) {
          csvHeader.push(header);
        } else {
          csvHeader.push("");
        }
      });

      if (parsedData.length > 1) {
        for (let i = 1; i < parsedData.length; i++) {
          const expenseCsv: ParsedExpense = {
            tempId: i,
            amount: 0,
            date: new Date(),
            description: "",
          };

          parsedData[i].forEach((data, index) => {
            const headerType = csvHeader[index];
            if (headerType === "description") {
              expenseCsv.description = data;
            }
            if (headerType === "amount") {
              const amount = currency(data);
              if (amount.value) {
                expenseCsv.amount = amount.value;
              } else {
                expenseCsv.amount = 0;
              }
            }
            if (headerType === "date") {
              const date = dayjs(data);
              if (date.isValid()) {
                expenseCsv.date = date.toDate();
              } else {
                expenseCsv.date = new Date();
              }
            }
            if (headerType === "category") {
              expenseCsv.categoryTitle = data.toLowerCase();
            }
          });

          expenseCsvList.push(expenseCsv);
        }
      }
    }

    onFinishParse(expenseCsvList);
  };

  reader.readAsText(csvFile);
}
