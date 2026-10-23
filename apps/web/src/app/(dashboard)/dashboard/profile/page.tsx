import type { Metadata } from "next";

import { ProfileScreen } from "@/features/account";

export const metadata: Metadata = { title: "حساب کاربری" };

export default function Page() {
  return <ProfileScreen />;
}
