const backgroundTaskHost = process.env.BACKGROUND_TASK_HOST || "http://localhost:3001";
const apiKey = process.env.NEXT_BG_TASK_API_KEY;

export async function uploadPdf(formData: FormData) {
  const url = `${backgroundTaskHost}/upload`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      "x-api-key": apiKey || "",
    },
  });

  return response;
}

export async function fetchTasks(userId: number) {
  const url = `${backgroundTaskHost}/tasks/${userId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey || "",
    },
  });

  return response;
}

export async function fetchCompletedTasks(userId: number, taskIds: string[] | string) {
  const ids = taskIds instanceof Array ? taskIds.join(",") : taskIds;
  const url = `${backgroundTaskHost}/tasks/${userId}/done?ids=${ids}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey || "",
    },
  });

  return response;
}

export async function deleteTasks(userId: number, taskIds: string[] | string) {
  const ids = taskIds instanceof Array ? taskIds.join(",") : taskIds;
  const url = `${backgroundTaskHost}/tasks/${userId}/done?ids=${ids}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "x-api-key": apiKey || "",
    },
  });

  return response;
}
