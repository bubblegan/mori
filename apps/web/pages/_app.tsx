import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import "../styles/globals.css";
import { trpc } from "../utils/trpc";

function App({ Component, pageProps }: AppProps) {
  const { theme } = useTheme();

  return (
    <ThemeProvider attribute="class" defaultTheme={theme}>
      <SessionProvider session={pageProps.session}>
        <Component {...pageProps} />
        <Analytics />
      </SessionProvider>
    </ThemeProvider>
  );
}

export default trpc.withTRPC(App);
