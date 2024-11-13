import { NextApiRequest, NextApiResponse } from "next";
import { nextAuthOptions } from "@/utils/auth/nextAuthOption";
import { getServerSession } from "next-auth";

const backgroundTaskHost = process.env.NEXT_BG_TASK_URL || "http://localhost:3001";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.id) return;
  const userId = session?.user?.id;

  if (!userId) {
    res.status(401).end(`Not Authenticated`);
  }

  if (req.method === "GET") {
    const response = await fetch(`${backgroundTaskHost}/tasks/${userId}/done?ids=${id}`, {
      method: "GET",
    });

    const completedTaskJson = await response.json();

    if (completedTaskJson) {
      const resJson = completedTaskJson.map((task: any) => {
        return JSON.parse(task);
      });

      res.status(200).json(resJson);
    } else {
      res.status(404).json({ message: "Task not found" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
