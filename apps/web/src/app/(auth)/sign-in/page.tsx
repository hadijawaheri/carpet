import type { Metadata } from "next";

import { SignInScreen } from "@/features/account";

export const metadata: Metadata = { title: "ورود", robots: { index: false } };

export default async function Page({ searchParams }: PageProps<"/sign-in">) {
  const { next } = await searchParams;
  return <SignInScreen next={typeof next === "string" ? next : undefined} />;
}
