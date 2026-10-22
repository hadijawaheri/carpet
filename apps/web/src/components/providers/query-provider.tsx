"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { ApiError } from "@/lib/api/parse";

export function QueryProvider({ children }: PropsWithChildren) {
  // One client per browser session; a module-level client would be shared between server requests
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // A 4xx will not change on retry; a 5xx or a dropped connection might
            retry: (count, error) =>
              !(error instanceof ApiError && error.status < 500) && count < 2,
          },
          mutations: { retry: 0 },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
