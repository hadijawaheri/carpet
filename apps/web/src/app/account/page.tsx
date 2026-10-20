import type { Metadata } from "next";

import { AccountPage } from "@/features/account";

export const metadata: Metadata = { title: "حساب کاربری", robots: { index: false } };

export default function Page() {
  return <AccountPage />;
}
