import { NextApiRequest, NextApiResponse } from "next";
import { nextAuthOptions } from "@/utils/auth/nextAuthOption";
import mapCategory from "@/utils/mapCategory";
import { prisma } from "@/utils/prisma";
import { Expense } from "@prisma/client";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import { getServerSession } from "next-auth";
import unzipper from "unzipper";
import generateCategorisePrompt, { CategorizableExpense } from "../../server/ai/generateCategorisePrompt";
import generateParsingPrompt from "../../server/ai/generateParsingPrompt";
import openAi from "../../server/ai/openAi";

const upload = multer({ dest: "/tmp" });
dayjs.extend(customParseFormat);

export type CreateExpense = Pick<Expense, "description" | "date"> & {
  tempId?: number;
  categoryName?: string;
  categoryId?: number;
  amount: number;
};

export type BankType = "DBS" | "CITI" | "CIMB" | "UOB" | "HSBC" | undefined;

export type ParsedResult = {
  expenses: CreateExpense[];
  statementDate: Date;
  bank: BankType;
};

export type ParsedResponse = {
  message: string;
  fileId: number;
  fileName: string;
  statementDate: Date;
  bank: string;
  totalAmount: string;
  expenses: CreateExpense[];
};

const processPdf = async (req: Request, res: Response, fileBuffer: Buffer) => {
  const formData = req.body;
  const enableAiCategorise = formData?.enableAiCategorise ?? false;

  const parseResult: {
    expenses: CreateExpense[];
    totalAmount?: string;
    statementDate?: Date;
    bank?: string;
  } = {
    bank: undefined,
    statementDate: undefined,
    totalAmount: undefined,
    expenses: [],
  };

  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.id) return;

  const userId = session.user.id;

  // ask Ai to extract all lines
  await prisma.eventLog.create({
    data: { type: "PDF_UPLOAD", message: "start writing prompt...", userId },
  });

  // generate the prompt
  const prompt = await generateParsingPrompt(fileBuffer);
  await prisma.eventLog.create({
    data: {
      type: "AI_PARSING_PROMPT",
      message: "prompting open AI...",
      detail: prompt,
      userId,
    },
  });

  // call openAi API
  const response = await openAi(prompt);
  const parsedContent = response.choices[0].message.content;
  await prisma.eventLog.create({
    data: {
      type: "AI_PARSING_PROMPT",
      message: "processing Open AI response..",
      detail: parsedContent,
      userId,
    },
  });

  // process the repsonse
  parsedContent?.split("\n").forEach((line, index) => {
    if (line.indexOf("bank:") === 0) {
      parseResult.bank = line.slice(line.indexOf(":") + 1).trim();
    }

    if (line.indexOf("total amount:") === 0) {
      parseResult.totalAmount = line.slice(line.indexOf(":") + 1).trim();
    }

    if (line.indexOf("statement date:") === 0) {
      const dateArr = line
        .slice(line.indexOf(":") + 1)
        .trim()
        .toLocaleLowerCase()
        .split(" ");
      dateArr[1] = dateArr[1].charAt(0).toUpperCase() + dateArr[1].slice(1);
      parseResult.statementDate = dayjs(dateArr.join(" "), "DD MMM YYYY").toDate();
    }

    if (line.split(",").length === 3) {
      const data = line.split(",").map((data) => data.trim());
      const date = dayjs(data[0], "DD MMM YYYY");

      parseResult.expenses.push({
        tempId: index,
        date: date.isValid() ? date.toDate() : new Date(),
        description: data[1],
        amount: Number(data[2]),
      });
    }
  });

  // add in categories
  await prisma.eventLog.create({
    data: { type: "PDF_UPLOAD", message: "Categorizing...", userId },
  });

  const categories = await prisma.category.findMany();
  const categoriesMap: Record<number, string> = {};
  categories.forEach((category) => {
    categoriesMap[category.id] = category.title;
  });
  mapCategory(categories, parseResult.expenses);

  // ask AI for the rest of categories
  if (enableAiCategorise) {
    await prisma.eventLog.create({
      data: { type: "PDF_UPLOAD", message: "start writing prompt for categorize...", userId },
    });
    const categorizableExpense: CategorizableExpense[] = parseResult.expenses.map((expense) => {
      return {
        description: expense.description,
        tempId: expense.tempId,
        categoryId: expense.categoryId || null,
      };
    });
    const categorisePrompt = await generateCategorisePrompt(categorizableExpense, {
      skipCategorised: true,
    });

    await prisma.eventLog.create({
      data: {
        type: "AI_PARSING_PROMPT",
        message: "prompting open AI...",
        detail: categorisePrompt,
        userId,
      },
    });

    const categoriseRes = await openAi(categorisePrompt);

    const categoriseContent = categoriseRes.choices[0].message.content;

    await prisma.eventLog.create({
      data: {
        type: "AI_PARSING_PROMPT",
        message: "processing Open AI response..",
        detail: categoriseContent,
        userId,
      },
    });

    const categorisedRecord: Record<string, string> = {};
    categoriseContent?.split("\n").forEach((line) => {
      const data = line.split(",");
      categorisedRecord[data[0]] = data[3];
    });

    parseResult.expenses.forEach((expense) => {
      if (expense.tempId && categorisedRecord[expense.tempId]) {
        expense.categoryId = Number(categorisedRecord[expense.tempId]);
        expense.categoryName = categoriesMap[Number(categorisedRecord[expense.tempId])];
      }
    });

    await prisma.eventLog.create({
      data: { type: "PDF_UPLOAD", message: "categorize with AI complete", userId },
    });
  }

  const parsedExpenses = parseResult.expenses.map((expense) => {
    const filteredExpense = { ...expense, userId: session?.user?.id };
    delete filteredExpense.tempId;
    return filteredExpense;
  });

  return {
    statementDate: parseResult.statementDate,
    bank: parseResult.bank,
    totalAmount: parseResult.totalAmount,
    expenses: parsedExpenses,
  };
};

async function handler(req: NextApiRequest & Request, res: NextApiResponse & Response) {
  const { method } = req;

  switch (method) {
    case "POST":
      const middleware = upload.single("statement");

      middleware(req, res, async () => {
        const session = await getServerSession(req, res, nextAuthOptions);
        if (!session?.user?.id) return;

        await prisma.eventLog.create({
          data: { type: "PDF_UPLOAD", message: "upload complete", userId: session?.user?.id },
        });

        if (req.file?.mimetype === "application/pdf") {
          try {
            const fileBuffer = fs.readFileSync(req.file?.path);
            const fileName = req.file?.originalname;

            const result = await processPdf(req, res, fileBuffer);

            // store temp statement
            const storeResult = await prisma.tempFile.create({
              data: { name: fileName, file: fileBuffer, userId: session.user.id },
            });

            res.status(200).json({
              fileId: storeResult.id,
              fileName,
              statementDate: result?.statementDate,
              bank: result?.bank,
              expenses: result?.expenses,
              totalAmount: result?.totalAmount,
              message: "Parse Successfully",
            });
          } catch (error) {
            res.status(500).json({ error, message: "Upload Fail" });
          }
        }

        if (req.file?.mimetype === "application/zip") {
          fs.createReadStream(req.file.path)
            .pipe(unzipper.Parse())
            .on("entry", async function (entry) {
              // const fileName = entry.path;
              const fileBuffer = await entry.buffer();
              await processPdf(req, res, fileBuffer);
              entry.autodrain();
            });
          res.status(200).json({ message: "Zip file Upload Successfully" });
        }
      });
      break;
    default:
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
