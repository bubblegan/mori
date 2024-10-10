export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/", "/categories", "/expenses", "/statements", "/api/:path*"],
};
