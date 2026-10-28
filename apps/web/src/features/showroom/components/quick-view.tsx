"use client";

import type { Carpet } from "@farsh/contracts";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { Dialog } from "radix-ui";

import { materialLabels } from "@/features/carpet-viewer";
import { formatPriceRial } from "@/lib/format";
import { paths } from "@/lib/paths";

import { materialFeel } from "../data/material-feel";
import { CarpetFacts } from "./carpet-facts";
import { CarpetPreview } from "./carpet-preview";
import { useShowroom } from "./showroom-store";

export function QuickView() {
  const { quickView, setQuickView } = useShowroom();
  return (
    <Dialog.Root open={quickView !== null} onOpenChange={(open) => !open && setQuickView(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-0 z-50 m-auto grid h-fit max-h-[92dvh] w-[calc(100%-2rem)] max-w-5xl animate-fade-up overflow-y-auto bg-background linen outline-none md:grid-cols-2">
          {quickView ? <QuickViewBody key={quickView.slug} carpet={quickView} /> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function QuickViewBody({ carpet }: { carpet: Carpet }) {
  const { addToSelection, setQuickView } = useShowroom();

  return (
    <>
      <Dialog.Close
        aria-label="بستن"
        className="absolute end-4 top-4 z-10 rounded-full bg-card p-2 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" aria-hidden />
      </Dialog.Close>
      <CarpetPreview
        carpet={carpet}
        imageSizes="(min-width: 768px) 40vw, 90vw"
        className="bg-alabaster p-8"
      />
      <div className="p-8 md:p-10">
        <p className="eyebrow text-gold-text">{materialLabels[carpet.material]}</p>
        <Dialog.Title className="mt-2 font-display text-4xl font-medium">
          {carpet.name}
        </Dialog.Title>
        <p className="mt-4 font-display text-3xl">{formatPriceRial(carpet.priceRial)}</p>
        <CarpetFacts carpet={carpet} className="mt-8" />
        <h3 className="mt-6 text-2xl">حس این جنس</h3>
        <Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {materialFeel[carpet.material]}
        </Dialog.Description>
        {carpet.isPlaceholder ? (
          <p className="mt-3 text-xs text-muted-foreground">
            ابعاد و تراکم این فرش هنوز نهایی نشده است.
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              addToSelection(carpet);
              setQuickView(null);
            }}
            className="flex-1 bg-primary py-4 text-sm text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            افزودن به فهرست
          </button>
          <button
            type="button"
            onClick={() => {
              addToSelection(carpet, { ask: true });
              setQuickView(null);
            }}
            className="flex-1 border border-foreground py-4 text-center text-sm transition hover:bg-card"
          >
            پرسیدن از کارشناس
          </button>
        </div>
        <Link
          href={paths.carpet(carpet.slug)}
          onClick={() => setQuickView(null)}
          className="mt-6 inline-flex items-center gap-2 text-sm text-madder underline-offset-6 hover:underline"
        >
          صفحه‌ی کامل این فرش
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
        </Link>
      </div>
    </>
  );
}
