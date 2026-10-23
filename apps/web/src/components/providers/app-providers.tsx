"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";

import { QueryProvider } from "@/components/providers/query-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// No ThemeProvider: one light theme by the owner's decision (docs/adr/0007)
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <NuqsAdapter>
      <DirectionProvider dir="rtl">
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster dir="rtl" position="top-center" closeButton />
          </TooltipProvider>
        </QueryProvider>
      </DirectionProvider>
    </NuqsAdapter>
  );
}
