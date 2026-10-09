"use client";

import type { PropsWithChildren } from "react";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <DirectionProvider dir="rtl">{children}</DirectionProvider>
    </ThemeProvider>
  );
}
