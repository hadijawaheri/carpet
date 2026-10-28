import type { Metadata } from "next";

import { EncyclopediaIndex } from "@/features/encyclopedia";
import { paths } from "@/lib/paths";

export const metadata: Metadata = {
  title: "دانشنامه‌ی فرش",
  description: "نوشته‌هایی درباره‌ی گره، رج و شانه، جنس پرز و قیمت فرش ایرانی.",
  alternates: { canonical: paths.encyclopedia },
};

export default function Page() {
  return <EncyclopediaIndex />;
}
