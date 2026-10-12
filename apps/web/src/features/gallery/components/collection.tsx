"use client";

import type { Carpet } from "@farsh/contracts";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { materialLabels } from "@/features/carpet-viewer";
import { formatNumber, formatSizeCm } from "@/lib/format";
import { paths } from "@/lib/paths";
import { cn } from "@/lib/utils";

import { accessionNumber } from "../accession";

/** Pixels per centimetre on the rail: every specimen hangs at its true size relative to the others. */
const SCALE = 0.9;

interface CollectionProps {
  carpets: Carpet[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function Collection({ carpets, activeIndex, onSelect }: CollectionProps) {
  return (
    <section id="collection" aria-labelledby="collection-title" className="bg-wall-deep">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pt-20 sm:px-10 lg:pt-28">
        <h2 id="collection-title" className="font-display text-display-l font-bold">
          مجموعه، به اندازه‌ی واقعی
        </h2>
        <p className="max-w-[56ch] text-lead text-on-wall-muted">
          همه‌ی فرش‌ها با یک مقیاس آویخته شده‌اند، پس بزرگی‌شان را کنار هم می‌بینید. هر کدام را
          انتخاب کنید تا در تالار آویزان شود.
        </p>
        <Link
          href={paths.room}
          className="inline-flex w-fit items-center gap-2 rounded-sm py-1 text-sm font-semibold underline decoration-saffron underline-offset-8 focus-visible:ring-2 focus-visible:ring-saffron focus-visible:outline-none"
        >
          فرش را در یک اتاق سه‌بعدی بچینید، با مبل و پرده و رنگ دلخواه شما
          <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
      </div>

      <div className="overflow-x-auto pb-16 lg:pb-24">
        <div className="relative mx-auto w-max px-4 pt-16 sm:px-10">
          {/* One rod for the whole wall: every carpet hangs from the same line, so heights compare truthfully. */}
          <span aria-hidden className="absolute inset-x-0 top-16 h-1 rounded-full bg-saffron" />
          <ol className="flex items-start gap-12">
            {carpets.map((c, i) => {
              const height = c.lengthCm * SCALE;
              const width = height * c.imageAspect;
              const active = i === activeIndex;
              return (
                <li key={c.slug} className="relative flex flex-col gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(i);
                      document.getElementById("hall")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    aria-pressed={active}
                    aria-label={`${c.name} را در تالار آویزان کن`}
                    className={cn(
                      "group relative block cursor-pointer overflow-hidden shadow-mount transition-transform duration-500 ease-settle outline-none hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-4 focus-visible:ring-offset-wall-deep motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                      active && "ring-2 ring-saffron ring-offset-4 ring-offset-wall-deep",
                    )}
                    style={{ width, height }}
                  >
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes={`${Math.round(width)}px`}
                      className="object-cover"
                    />
                  </button>
                  <div className="flex flex-col gap-0.5" style={{ width: Math.max(width, 150) }}>
                    <span className="font-display text-xl font-bold">{c.name}</span>
                    <span className="text-label text-on-wall-muted">
                      {materialLabels[c.material]} · {formatSizeCm(c.widthCm, c.lengthCm)}
                    </span>
                    <Link
                      href={`${paths.room}?carpet=${c.slug}`}
                      className="w-fit rounded-sm text-label font-semibold underline decoration-saffron underline-offset-4 focus-visible:ring-2 focus-visible:ring-saffron focus-visible:outline-none"
                    >
                      در اتاق بگذارید
                    </Link>
                    <span className="font-mono text-accession text-on-wall-muted">
                      <span dir="ltr">{accessionNumber(i)}</span>
                    </span>
                  </div>
                </li>
              );
            })}
            <li className="flex flex-col gap-3 self-end pb-24" aria-label="مقیاس">
              <span className="block h-px bg-on-wall-muted" style={{ width: 100 * SCALE }} />
              <span className="text-label text-on-wall-muted">{formatNumber(1)} متر</span>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
