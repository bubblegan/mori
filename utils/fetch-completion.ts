import { CoreTool, GenerateTextResult } from "ai";

export async function fetchCompletion(prompt: string) {
  const response = await fetch("/api/completion", {
    method: "POST",
    body: JSON.stringify({
      prompt,
    }),
  });

  if (response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await response.json()) as GenerateTextResult<Record<string, CoreTool<any, any>>>;
    const completion = result.text;

    return completion;
  }

  // TODO: handle error here
  return "";
}
