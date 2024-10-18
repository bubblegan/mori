import { NextApiRequest, NextApiResponse } from "next";
import { nextAuthOptions } from "@/utils/auth/nextAuthOption";
import Redis from "ioredis";
import { getServerSession } from "next-auth";

const redis = new Redis({
  host: process.env.REDIS_HOST, // The Redis service name defined in Docker Compose
  port: 6379,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // Get the ID from the URL

  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.id) return;
  const userId = session?.user?.id;

  if (!userId) {
    res.status(401).end(`Not Authenticated`);
  }

  if (req.method === "GET") {
    // Find the task with the specified ID
    const completedTaskRaw = await redis.get(`done:${userId}:${id}`);
    const completedTaskJson = JSON.parse(completedTaskRaw || "");
    if (completedTaskJson) {
      res.status(200).json(completedTaskJson);
    } else {
      res.status(404).json({ message: "Task not found" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
