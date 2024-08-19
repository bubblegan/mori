import { nextAuthOptions } from "@/utils/auth/nextAuthOption";
import { getServerSession } from "next-auth";
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";

export async function createContext(ctx: trpcNext.CreateNextContextOptions) {
  const { req, res } = ctx;
  const session = await getServerSession(req, res, nextAuthOptions);

  return {
    req,
    res,
    session,
  };
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
