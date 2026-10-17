import "./globals.css";

import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Markazi_Text, Vazirmatn } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { defaultMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

// The design's Latin pair; neither has Persian glyphs, so each falls back to its closest Persian match.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  // Next's metric fallback (a local serif) has Arabic glyphs and would win over Markazi Text.
  adjustFontFallback: false,
  fallback: [],
});
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
  adjustFontFallback: false,
  fallback: [],
});
const markazi = Markazi_Text({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-markazi",
  display: "swap",
});
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
