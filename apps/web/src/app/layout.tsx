import "./globals.css";

import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Reem_Kufi, Vazirmatn } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { defaultMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});
const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  variable: "--font-reem-kufi",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  variable: "--font-fraunces",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        vazirmatn.variable,
        reemKufi.variable,
        fraunces.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
