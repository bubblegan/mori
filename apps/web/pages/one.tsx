import React from "react";
import Head from "next/head";
import { AiExpenseForm } from "@/components/ai-expense-form";
import { Toaster } from "@/ui/toaster";

export default function One() {
  return (
    <>
      <Head>
        <title>One</title>
        <meta name="description" content="Enter your own expenses" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen flex-col items-center justify-center px-8">
        <div className="w-[500px]">
          <AiExpenseForm />
        </div>
        <Toaster />
      </div>
    </>
  );
}
