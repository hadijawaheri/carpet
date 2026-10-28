import type { Metadata } from "next";

export const siteName = "فرش";

export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:7782");

export const defaultMetadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: "فرش · Farsh", template: "%s · فرش" },
  description: "فرش ایرانی، سه‌بعدی و لمسی: نقش، جنس و گره را از نزدیک ببینید.",
  openGraph: { type: "website", locale: "fa_IR", siteName },
};

/** The public address of a site path, for links that leave the site (sharing, QR codes, sitemap). */
export const absoluteUrl = (path: string) => new URL(path, siteUrl).href;
