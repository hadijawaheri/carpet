import type { Metadata } from "next";

import { KnotCalculatorPage } from "@/features/knot-calculator";
import { paths } from "@/lib/paths";

export const metadata: Metadata = {
  title: "ماشین‌حساب رج و تراکم گره",
  description:
    "رج فرش دستباف یا شانه و تراکم فرش ماشینی را بنویسید و شمار گره در متر مربع و در کل فرش را ببینید.",
  alternates: { canonical: paths.knotCalculator },
};

export default function Page() {
  return <KnotCalculatorPage />;
}
