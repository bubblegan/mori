import { NextApiRequest, NextApiResponse } from "next";
import { Request, Response } from "express";
import OpenAI from "openai";
import { z } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const requestBodySchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"), // Must be a non-empty string
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
      try {
        const chatCompletion = await client.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o",
        });
        const promptValue = chatCompletion.choices[0].message.content || "";
        res.status(200).json({ completion: promptValue });
      } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
      }
      break;
    default:
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default handler;
