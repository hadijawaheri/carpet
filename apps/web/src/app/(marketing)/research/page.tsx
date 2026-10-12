import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { MaterialSpecs, ResearchCatalogue } from "@/features/research";

export const metadata: Metadata = {
  title: "پژوهش",
  description: "نوشته‌هایی درباره‌ی جنس، تراکم گره و قیمت فرش ایرانی؛ هنوز پیش‌نویس‌اند.",
};

export default function ResearchPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <ResearchCatalogue />
        <MaterialSpecs />
      </main>
    </>
  );
}
