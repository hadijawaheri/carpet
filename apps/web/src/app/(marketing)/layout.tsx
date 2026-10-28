import type { ReactNode } from "react";

import { ShowroomShell } from "@/features/showroom";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <ShowroomShell>{children}</ShowroomShell>;
}
