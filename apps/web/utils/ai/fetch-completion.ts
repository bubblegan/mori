export async function fetchCompletion(prompt: string) {
  const response = await fetch("/api/completion", {
    method: "POST",
    body: JSON.stringify({
      prompt,
    }),
    headers: new Headers({
      "content-type": "application/json",
    }),
  });

  if (!response.ok) {
    throw new Error("failed to fetch");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return response.json();
}
