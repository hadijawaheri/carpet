import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireSession } from "@/lib/auth/dal";
import { paths } from "@/lib/paths";

export const metadata: Metadata = { robots: { index: false } };

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Pages repeat this check: a layout does not re-render on client navigation
  await requireSession(paths.dashboard);
  return children;
}
