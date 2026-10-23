import type { Metadata } from "next";

import { SignInScreen } from "@/features/account";

export const metadata: Metadata = { title: "ورود", robots: { index: false } };

// Explicit props: the generated PageProps global only exists after `next typegen`/build
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next } = await searchParams;
  return <SignInScreen next={typeof next === "string" ? next : undefined} />;
}
