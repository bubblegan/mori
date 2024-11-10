import type { AppProps } from "next/app";
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
      </SessionProvider>
    </ThemeProvider>
  );
}

export default trpc.withTRPC(App);
