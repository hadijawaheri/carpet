import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CertificatePage } from "@/features/certificate";
import { getCarpet } from "@/features/showroom";
import { paths } from "@/lib/paths";
import { qrDataUri } from "@/lib/qr";
import { absoluteUrl } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const carpet = await getCarpet((await params).slug);
  if (!carpet) notFound();
  return {
    title: `شناسنامه‌ی ${carpet.name}`,
    alternates: { canonical: paths.certificate(carpet.slug) },
    // The carpet's own page is the one to index; this is its printable record
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const carpet = await getCarpet((await params).slug);
  if (!carpet) notFound();
  const qr = await qrDataUri(absoluteUrl(paths.certificate(carpet.slug)));
  return <CertificatePage carpet={carpet} qr={qr} />;
}
