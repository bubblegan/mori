import next, { NextApiRequest, NextApiResponse } from "next";
import { nextAuthOptions } from "@/utils/auth/nextAuthOption";
import { prisma } from "@/utils/prisma";
import { Request, Response } from "express";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const requestBodySchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(200, "Prompt maximum length is 200 characters"),
  categories: z.array(
    z.object({
      title: z.string(),
      color: z.string(),
    })
  ),
});

const Colour = z.object({
  colourList: z.array(
    z.object({
      title: z.string(),
      color: z.string(),
    })
  ),
});

async function handler(req: NextApiRequest & Request, res: NextApiResponse & Response) {
  const { method } = req;

  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.id) return;

  switch (method) {
    case "POST":
      const validation = requestBodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }

      const { prompt, categories } = validation.data;

      let colorTitlePair = "";

      categories.forEach((category) => {
        colorTitlePair += `{${category.title}, ${category.color}}, \n`;
      });

      let systemPrompt =
        "You are a helping the user to choose the background colour that represent the category in an expense tracker. \n";
      systemPrompt += `Here are the array of current categories and colour pair that user have in the format of {title, color}, [${colorTitlePair}] \n`;
      systemPrompt += `Note that it is the background color and the text on the front of it is in white colour, so the color generated should not be too bright for user to be able to read the text \n`;
      systemPrompt +=
        "Help me modify any of it if user request, those that are not remain as the same colour. \n";
      systemPrompt +=
        "User may request like change food to different colour, thus change only food category \n";
      systemPrompt +=
        "User may request like change all colour to more soothing colour, thus change all colour for all category \n";
      systemPrompt += "Parse into the response format array after you are done \n";

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
          response_format: zodResponseFormat(Colour, "colour"),
        });

        const color = chatCompletion.choices[0].message.parsed;
        res.status(200).json(color);
      } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
      }
      break;
    default:
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default handler;
