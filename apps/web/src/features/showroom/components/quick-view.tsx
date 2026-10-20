"use client";

import type { Carpet } from "@farsh/contracts";
import { X } from "lucide-react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { useState } from "react";

import { CarpetStage, materialLabels } from "@/features/carpet-viewer";
import { formatDensity, knotsPerSquareMetre } from "@/lib/density";
import { formatNumber, formatPriceRial, formatSizeCm } from "@/lib/format";

import { materialFeel } from "../data/material-feel";
import { MaterialPills } from "./material-pills";
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
  const [view, setView] = useState<"photo" | "cloth">("photo");
  const [loupe, setLoupe] = useState({ x: 50, y: 50 });
  const knots = carpet.density ? knotsPerSquareMetre(carpet.density) : null;

  const facts = [
    ["تراکم", carpet.density ? formatDensity(carpet.density) : "ثبت نشده"],
    ["ابعاد", formatSizeCm(carpet.widthCm, carpet.lengthCm)],
    ["جنس", materialLabels[carpet.material]],
    [
      "گره در متر مربع",
      knots === null
        ? "ثبت نشده"
        : `${carpet.density?.unit === "raj" ? "حدود " : ""}${formatNumber(knots)}`,
    ],
  ] as const;

  return (
    <>
      <Dialog.Close
        aria-label="بستن"
        className="absolute end-4 top-4 z-10 rounded-full bg-card p-2 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" aria-hidden />
      </Dialog.Close>
      <div className="flex flex-col gap-6 bg-alabaster p-8">
        <MaterialPills
          label="نمای فرش"
          value={view}
          onChange={setView}
          options={[
            { value: "photo", label: "عکس" },
            { value: "cloth", label: "سه‌بعدی، تکانش دهید" },
          ]}
        />
        <div className="relative h-[420px]">
          {view === "photo" ? (
            <Image
              src={carpet.image}
              alt={`فرش ${carpet.name}`}
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-contain drop-shadow-xl"
            />
          ) : (
            <CarpetStage
              carpet={carpet}
              material={carpet.material}
              imageSizes="(min-width: 768px) 40vw, 90vw"
              className="size-full"
            />
          )}
        </div>
        <div>
          <p className="eyebrow text-muted-foreground">بررسی گره، نشانگر را روی نوار حرکت دهید</p>
          <div
            role="img"
            aria-label={`نمای نزدیک بافت ${carpet.name}`}
            onPointerMove={(e) => {
              const b = e.currentTarget.getBoundingClientRect();
              setLoupe({
                x: ((e.clientX - b.left) / b.width) * 100,
                y: ((e.clientY - b.top) / b.height) * 100,
              });
            }}
            className="mt-2 h-32 cursor-crosshair touch-none border"
            style={{
              backgroundImage: `url(${carpet.image})`,
              backgroundSize: "900%",
              backgroundPosition: `${loupe.x}% ${loupe.y}%`,
            }}
          />
        </div>
      </div>
      <div className="p-8 md:p-10">
        <p className="eyebrow text-gold-text">{materialLabels[carpet.material]}</p>
        <Dialog.Title className="mt-2 font-display text-4xl font-medium">
          {carpet.name}
        </Dialog.Title>
        <p className="mt-4 font-display text-3xl">{formatPriceRial(carpet.priceRial)}</p>
        <dl className="mt-8 grid grid-cols-2 gap-y-4 border-y py-6 text-sm">
          {facts.map(([term, value]) => (
            <div key={term}>
              <dt className="eyebrow text-muted-foreground">{term}</dt>
              <dd className="mt-1">{value}</dd>
            </div>
          ))}
        </dl>
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
      </div>
    </>
  );
}
