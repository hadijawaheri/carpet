"use client";

import type { PropsWithChildren } from "react";

import { DirectionProvider } from "@/components/ui/direction";

export function AppProviders({ children }: PropsWithChildren) {
  return <DirectionProvider dir="rtl">{children}</DirectionProvider>;
}
