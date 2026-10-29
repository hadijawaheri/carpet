import type { Metadata } from "next";

import { CatalogueScreen } from "@/features/catalogue-admin";

export const metadata: Metadata = { title: "فرش‌های ویترین" };

export default function Page() {
  return <CatalogueScreen />;
}
