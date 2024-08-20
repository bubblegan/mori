import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = await streamText({
    model: openai("gpt-4"),
    prompt,
  });

  return result.toDataStreamResponse();
}
