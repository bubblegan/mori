import { NextApiRequest, NextApiResponse } from "next";
import { Request, Response } from "express";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handler(
  req: NextApiRequest & Request,
  res: NextApiResponse<{ completion: string }> & Response
) {
  const { method } = req;

  switch (method) {
    case "POST":
      const { prompt } = req.body;
      const chatCompletion = await client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o",
      });
      const promptValue = chatCompletion.choices[0].message.content || "";
      res.status(200).json({ completion: promptValue });
      break;
    default:
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default handler;
