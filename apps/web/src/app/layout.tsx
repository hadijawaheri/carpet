import "./globals.css";

import type { Metadata } from "next";
import { Azeret_Mono, Markazi_Text, Vazirmatn } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { defaultMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});
// Markazi is a Naskh serif drawn by an Iranian type designer; it sets the gallery inscriptions.
const markazi = Markazi_Text({
  subsets: ["arabic", "latin"],
  variable: "--font-markazi",
  display: "swap",
});
const azeret = Azeret_Mono({ subsets: ["latin"], variable: "--font-azeret", display: "swap" });

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={cn("antialiased", vazirmatn.variable, markazi.variable, azeret.variable)}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
