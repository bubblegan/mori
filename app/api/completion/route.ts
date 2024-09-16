import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
  });

  return Response.json(result);
}
