export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/((?!api/trpc/auth.create|sign-in|sign-up|api/cron/seed).*)"],
};
