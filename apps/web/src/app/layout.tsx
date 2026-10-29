import "./globals.css";

import type { Metadata } from "next";
import localFont from "next/font/local";
import { connection } from "next/server";

import { AppProviders } from "@/components/providers/app-providers";
import { defaultMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

// Self-hosted (docs/adr/0019): fetching from Google at build time failed builds at random. Variable
// files, one per script the stack needs them for.
// The design's Latin pair; neither has Persian glyphs, so each falls back to its closest Persian match.
const cormorant = localFont({
  src: [
    {
      path: "./fonts/cormorant-garamond-latin-wght-normal.woff2",
      weight: "300 700",
      style: "normal",
    },
    {
      path: "./fonts/cormorant-garamond-latin-wght-italic.woff2",
      weight: "300 700",
      style: "italic",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
  // A metric fallback (a local serif) has Arabic glyphs and would win over Markazi Text.
  adjustFontFallback: false,
  fallback: [],
});
const jost = localFont({
  src: "./fonts/jost-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-jost",
  display: "swap",
  adjustFontFallback: false,
  fallback: [],
});
// Only the Arabic-script files: Latin text in both stacks is set by Cormorant or Jost first.
const markazi = localFont({
  src: "./fonts/markazi-text-arabic-wght-normal.woff2",
  weight: "400 700",
  variable: "--font-markazi",
  display: "swap",
});
const vazirmatn = localFont({
  src: "./fonts/vazirmatn-arabic-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = defaultMetadata;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Every page renders per request so Next can stamp the CSP nonce from proxy.ts on its scripts;
  // the carpets fetch keeps its own 60 s cache
  await connection();
  return (
    <html
      lang="fa"
      dir="rtl"
      className={cn(
        "scroll-smooth antialiased",
        cormorant.variable,
        jost.variable,
        markazi.variable,
        vazirmatn.variable,
      )}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
