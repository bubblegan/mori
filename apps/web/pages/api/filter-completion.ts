import { NextApiRequest, NextApiResponse } from "next";
import { Request, Response } from "express";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const requestBodySchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"), // Must be a non-empty string
});

const Filter = z.object({
  keyword: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  category: z.array(z.string()),
});

async function handler(req: NextApiRequest & Request, res: NextApiResponse & Response) {
  const { method } = req;

  switch (method) {
    case "POST":
      const validation = requestBodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const { prompt } = validation.data;
      const today = new Date();

      let systemPrompt =
        "You need to help user to filter their expense, filter the imformation from what user has prompted. \n";
      systemPrompt += `for context, today date is, ${today.toDateString()}. \n`;
      systemPrompt += "for keyword, it should be the expenses description that user are looking for. \n";
      systemPrompt +=
        "only filter keyword when they explicitly specify, like for example, all expenses spend on Apple, den keyword should be Apple \n";
      systemPrompt += "for startDate and endDate, it should be the date range that the user wanted.  \n";
      systemPrompt += "if dont have just leave it as empty string for start and end date  \n";
      systemPrompt +=
        "for category, it should be included only when user specify too, like all food that i spend on last month, category should be food.  \n";

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
          response_format: zodResponseFormat(Filter, "filter"),
        });
        const filter = chatCompletion.choices[0].message.parsed;
        res.status(200).json(filter);
      } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
      }
      break;
    default:
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default handler;
