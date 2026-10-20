"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { DirectionProvider } from "@/components/ui/direction";

export function AppProviders({ children }: PropsWithChildren) {
  // One client per browser session; a module-level client would be shared between server requests.
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { mutations: { retry: 0 } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <DirectionProvider dir="rtl">{children}</DirectionProvider>
    </QueryClientProvider>
  );
}
