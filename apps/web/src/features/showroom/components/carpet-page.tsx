import type { Carpet } from "@farsh/contracts";
import { Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { materialLabels } from "@/features/carpet-viewer";
import { formatPriceRial, formatSizeCm } from "@/lib/format";
import { paths } from "@/lib/paths";
import { absoluteUrl } from "@/lib/seo";

import { materialFeel } from "../data/material-feel";
import { moreCarpets } from "../data/more-carpets";
import { CarpetActions } from "./carpet-actions";
import { CarpetFacts } from "./carpet-facts";
import { CarpetPreview } from "./carpet-preview";
import { ShareBar } from "./share-bar";

/** A carpet's permanent page: what the quick view shows, at an address that can be shared. */
export function CarpetPage({ carpet, carpets }: { carpet: Carpet; carpets: Carpet[] }) {
  const more = moreCarpets(carpet, carpets);

  return (
    <main className="mx-auto max-w-7xl px-6 pt-32 pb-12">
      <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={paths.home} className="hover:text-foreground">
              خانه
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={paths.collection} className="hover:text-foreground">
              مجموعه
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">
            {carpet.name}
          </li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <CarpetPreview
          carpet={carpet}
          priority
          imageSizes="(min-width: 768px) 45vw, 90vw"
          className="bg-alabaster p-8"
        />
        <div className="md:py-4">
          <p className="eyebrow text-gold-text">{materialLabels[carpet.material]}</p>
          <h1 className="mt-2 font-display text-5xl font-medium">{carpet.name}</h1>
          <p className="mt-4 font-display text-3xl">{formatPriceRial(carpet.priceRial)}</p>
          <CarpetFacts carpet={carpet} className="mt-8" />
          <h2 className="mt-6 text-2xl">حس این جنس</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {materialFeel[carpet.material]}
          </p>
          {carpet.isPlaceholder ? (
            <p className="mt-3 text-xs text-muted-foreground">
              ابعاد و تراکم این فرش هنوز نهایی نشده است.
            </p>
          ) : null}
          <div className="mt-8">
            <CarpetActions carpet={carpet} />
          </div>
          <Link
            href={paths.certificate(carpet.slug)}
            className="mt-6 inline-flex items-center gap-2 text-sm text-madder underline-offset-6 hover:underline"
          >
            <Award className="size-4" aria-hidden />
            شناسنامه‌ی این فرش
          </Link>
          <div className="mt-8 border-t pt-6">
            <p className="eyebrow text-muted-foreground">این فرش را برای کسی بفرستید</p>
            <div className="mt-3">
              <ShareBar url={absoluteUrl(paths.carpet(carpet.slug))} text={`فرش ${carpet.name}`} />
            </div>
          </div>
        </div>
      </div>

      {more.length > 0 ? (
        <section aria-labelledby="more-title" className="mt-24">
          <h2 id="more-title" className="text-3xl">
            فرش‌های دیگر
          </h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((other) => (
              <li key={other.slug}>
                <Link href={paths.carpet(other.slug)} className="group block">
                  <div className="relative aspect-[3/4] bg-alabaster p-6 transition duration-500 group-hover:-translate-y-1 group-hover:shadow-lift">
                    <div className="relative size-full">
                      <Image
                        src={other.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <p className="mt-3 eyebrow text-gold-text">{materialLabels[other.material]}</p>
                  <p className="mt-1 text-xl">{other.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSizeCm(other.widthCm, other.lengthCm)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
