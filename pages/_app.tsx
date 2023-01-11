import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";

import NProgress from "nprogress";
import "nprogress/nprogress.css";

import "./style.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const [query_client] = useState(() => new QueryClient());

  useEffect(() => {
    const handleStart = (url: string) => {
      console.log(`Loading: ${url}`);
      NProgress.start();
    };

    const handleStop = () => {
      NProgress.done();
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  return (
    <QueryClientProvider client={query_client}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
