import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";

import "./style.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  const query_client = new QueryClient();

  return (
    <QueryClientProvider client={query_client}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
