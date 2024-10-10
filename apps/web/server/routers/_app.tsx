/**
 * This file contains the root router of your tRPC-backend
 */
import { router } from "../trpc";
import { authRouter } from "./auth";
import { catergoryRouter } from "./category";
import { expenseRouter } from "./expense";
import { logRouter } from "./log";
import { statementRouter } from "./statement";
import { tagRouter } from "./tag";

export const appRouter = router({
  statement: statementRouter,
  expense: expenseRouter,
  category: catergoryRouter,
  auth: authRouter,
  log: logRouter,
  tag: tagRouter,
});

export type AppRouter = typeof appRouter;
