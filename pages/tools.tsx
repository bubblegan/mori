import { useRef, ChangeEvent, useState } from "react";
import Head from "next/head";
import BasePage from "@/components/base-page";
import ExpenseTableUi, { ExpenseTableData } from "@/components/expense-table-ui";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/utils/download-as-csv";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { ParsedResult } from "./api/upload";

const columnHelper = createColumnHelper<ExpenseTableData>();

const columns = [
  columnHelper.accessor("description", {
    cell: (info) => info.getValue(),
    header: () => <span>Description</span>,
    meta: {
      className: "w-[400px]",
    },
  }),
  // columnHelper.accessor("category", {
  //   cell: (info) => {
  //     if (!info.getValue()) return null;

  //     return (
  //       <div className="px-3 py-0.5 rounded-full bg-blue-700 w-fit capitalize">
  //         {info.getValue()}
  //       </div>
  //     );
  //   },
  //   header: () => <span>Category</span>,
  // }),
  columnHelper.accessor("amount", {
    cell: (info) => (
      <div className="flex justify-between">
        $<div className="text-right pr-8">{info.getValue()}</div>
      </div>
    ),
    header: () => <span>Amount</span>,
    sortingFn: "alphanumeric",
    enableSorting: true,
    meta: {
      className: "w-[150px]",
    },
  }),
  columnHelper.accessor("date", {
    cell: (info) => info.getValue(),
    header: () => <span>Date</span>,
  }),
];

export default function Tools() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [data, setData] = useState<ExpenseTableData[]>(() => []);

  const handleUploadClick = () => {
    // 👇 We redirect the click event onto the hidden input element
    inputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }

    const statement = e.target.files[0];
    const formData = new FormData();
    formData.append("statement", statement);

    const response = await fetch("/api/upload?parseOnly=true", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data: ParsedResult = await response.json();
      const tableData = data.expenses.map((expense) => {
        return {
          description: expense.description,
          amount: `${Number(expense.amount).toFixed(2).toLocaleString()}`,
          date: dayjs(expense.date).format("YYYY MMM DD"),
        };
      });
      setData(tableData);
    }
  };

  return (
    <>
      <Head>
        <title>Tools</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BasePage>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-2">
            <Button onClick={handleUploadClick}>Parse</Button>
            <Button disabled={!data} onClick={() => downloadCsv(data)}>
              Download as CSV
            </Button>
          </div>
          <ExpenseTableUi data={data} columns={columns} />
          <input type="file" ref={inputRef} onChange={handleFileChange} style={{ display: "none" }} />
        </div>
      </BasePage>
    </>
  );
}
