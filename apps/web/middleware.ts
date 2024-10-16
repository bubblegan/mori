export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/", "/categories", "/expenses", "/statements", "/task", "/api/:path*"],
};
