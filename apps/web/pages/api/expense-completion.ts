import { NextApiRequest, NextApiResponse } from "next";
import { Request, Response } from "express";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const requestBodySchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(200, "Prompt maximum length is 200 characters"),
  categories: z.array(z.string()),
});

const Expense = z.object({
  description: z.string(),
  category: z.string(),
  date: z.string(),
  amount: z.number(),
});

async function handler(req: NextApiRequest & Request, res: NextApiResponse & Response) {
  const { method } = req;

  switch (method) {
    case "POST":
      const validation = requestBodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const { prompt, categories } = validation.data;
      const today = new Date();
      let categoriesPrompt = "";

      categories.forEach((category) => {
        categoriesPrompt += `${category}, \n`;
      });

      let systemPrompt = "You task is to extract information out of the expense that user has prompted. \n";
      systemPrompt += `for context, today date is, ${today.toDateString()}. \n`;
      systemPrompt += `Here are the categories avaiable: ${categoriesPrompt}. \n`;
      systemPrompt +=
        "for description, it should be expenses description. leave empty string if user does not include. \n";
      systemPrompt += "for amount, default it 0 if user does not include it. \n";
      systemPrompt +=
        "for category, it should be base on the description and match with available categories provided, if not, leave it as misc.  \n";
      systemPrompt +=
        "for date, default it as today, unless user include it. The format should be yyyy-MM-dd which follow the ISO 8601 \n";

      try {
        const chatCompletion = await client.beta.chat.completions.parse({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            { role: "user", content: prompt },
          ],
          model: "gpt-4o",
          response_format: zodResponseFormat(Expense, "expense"),
        });
        const expense = chatCompletion.choices[0].message.parsed;
        res.status(200).json(expense);
      } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
      }
      break;
    default:
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default handler;
