import type { Carpet } from "@farsh/contracts";
import Image from "next/image";
import Link from "next/link";

import { Monogram } from "@/components/shared/monogram";
import { paths } from "@/lib/paths";
import { cn } from "@/lib/utils";

import { certificateRows, isCertified } from "../data/certificate-rows";
import { PrintButton } from "./print-button";

/**
 * A carpet's certificate, laid out to print on one A4 page. The QR code holds this page's own
 * address, so a printed tag on the carpet leads back here to check it.
 */
export function CertificatePage({ carpet, qr }: { carpet: Carpet; qr: string }) {
  const certified = isCertified(carpet);

  return (
    <main className="mx-auto max-w-4xl px-6 pt-32 pb-12 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={paths.carpet(carpet.slug)}
          className="text-sm text-madder underline-offset-6 hover:underline"
        >
          بازگشت به صفحه‌ی فرش
        </Link>
        <PrintButton />
      </div>

      <article className="border-2 border-double border-gold bg-card p-8 sm:p-12 print:border-foreground">
        <header className="flex items-start justify-between gap-6 border-b pb-6">
          <div>
            <p className="eyebrow text-gold-text">شناسنامه‌ی فرش</p>
            <h1 className="mt-2 font-display text-4xl font-medium">{carpet.name}</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              شناسه:{" "}
              <span dir="ltr" className="font-mono">
                {carpet.slug}
              </span>
            </p>
          </div>
          <Monogram />
        </header>

        <p
          className={cn(
            "mt-6 border-s-2 ps-4 text-sm",
            certified ? "border-gold text-foreground" : "border-madder text-muted-foreground",
          )}
        >
          {certified
            ? "مشخصات این فرش ثبت و تأیید شده است."
            : "پیش‌نمایش: مشخصات اصالت این فرش هنوز تأیید و ثبت نشده است. تا آن زمان این برگه سند اصالت نیست."}
        </p>

        <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_12rem]">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {certificateRows(carpet).map(([term, value]) => (
              <div key={term}>
                <dt className="eyebrow text-muted-foreground">{term}</dt>
                <dd className="mt-1">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-56 w-full bg-alabaster p-3">
              <Image
                src={carpet.image}
                alt={`عکس فرش ${carpet.name}`}
                fill
                sizes="192px"
                className="object-contain p-3"
              />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- a data: URI needs no optimising */}
            <img
              src={qr}
              alt="کد QR نشانی همین شناسنامه"
              width={128}
              height={128}
              className="size-32"
            />
            <p className="text-center text-xs text-muted-foreground">
              برای دیدن نسخه‌ی برخط، کد را اسکن کنید.
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
