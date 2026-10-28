import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { materialLabels } from "@/features/carpet-viewer";
import { CarpetPage, getCarpet, getCarpets } from "@/features/showroom";
import { formatSizeCm } from "@/lib/format";
import { paths } from "@/lib/paths";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const carpet = await getCarpet(slug);
  if (!carpet) notFound();
  const description = `فرش ${carpet.name}، ${materialLabels[carpet.material]}، ${formatSizeCm(carpet.widthCm, carpet.lengthCm)}. از نزدیک ببینید و تکانش دهید.`;
  return {
    title: carpet.name,
    description,
    alternates: { canonical: paths.carpet(carpet.slug) },
    openGraph: {
      title: carpet.name,
      description,
      url: paths.carpet(carpet.slug),
      images: [{ url: carpet.image, alt: `فرش ${carpet.name}` }],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [carpet, carpets] = await Promise.all([getCarpet(slug), getCarpets()]);
  // The root loading.tsx has already streamed a 200, so Next answers with the not-found page and a
  // noindex tag instead of a 404 status
  if (!carpet) notFound();
  return <CarpetPage carpet={carpet} carpets={carpets} />;
}
