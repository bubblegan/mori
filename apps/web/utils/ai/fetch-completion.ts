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

export async function fetchFilterCompletion(prompt: string) {
  const response = await fetch("/api/filter-completion", {
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

export async function fetchThemeCompletion(prompt: string, categories: { title: string; color: string }[]) {
  const response = await fetch("/api/theme-completion", {
    method: "POST",
    body: JSON.stringify({
      prompt,
      categories,
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

export async function fetchExpenseCompletion(prompt: string, categories: string[]) {
  const response = await fetch("/api/expense-completion", {
    method: "POST",
    body: JSON.stringify({
      prompt,
      categories,
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
