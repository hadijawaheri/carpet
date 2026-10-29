import type { Metadata } from "next";

import { CarpetEditScreen } from "@/features/catalogue-admin";

export const metadata: Metadata = { title: "ویرایش فرش" };

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <CarpetEditScreen slug={slug} />;
}
