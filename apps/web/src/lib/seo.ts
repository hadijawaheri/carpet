import type { Metadata } from "next";

export const siteName = "فرش";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:7782"),
  title: { default: "فرش · Farsh", template: "%s · فرش" },
  description: "فرش ایرانی، سه‌بعدی و لمسی: نقش، جنس و گره را از نزدیک ببینید.",
  openGraph: { type: "website", locale: "fa_IR", siteName },
};
