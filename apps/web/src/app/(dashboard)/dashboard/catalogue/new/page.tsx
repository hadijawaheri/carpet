import type { Metadata } from "next";

import { CarpetCreateScreen } from "@/features/catalogue-admin";

export const metadata: Metadata = { title: "فرش تازه" };

export default function Page() {
  return <CarpetCreateScreen />;
}
