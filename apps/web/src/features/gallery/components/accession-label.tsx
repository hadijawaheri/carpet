"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import { materialLabels } from "@/features/carpet-viewer";
import { formatDensity, knotsPerSquareMetre } from "@/lib/density";
import { formatNumber, formatSizeCm } from "@/lib/format";
import { cn } from "@/lib/utils";

import { accessionNumber } from "../accession";

const materials: PileMaterial[] = ["silk", "wool", "machine"];

const materialNotes: Record<PileMaterial, string> = {
  silk: "سبک و روان؛ دیر آرام می‌گیرد و برقش با زاویه عوض می‌شود.",
  wool: "سنگین‌تر و گرم؛ تاخوردگی نرم، براقی مات.",
  machine: "خشک و یکدست؛ زود به حالت صاف برمی‌گردد.",
};

interface AccessionLabelProps {
  carpet: Carpet;
  index: number;
  count: number;
  material: PileMaterial;
  onMaterialChange: (material: PileMaterial) => void;
  onStep: (direction: 1 | -1) => void;
  className?: string;
}

/** The museum tombstone label, doubling as the carpet's controls. */
export function AccessionLabel({
  carpet,
  index,
  count,
  material,
  onMaterialChange,
  onStep,
  className,
}: AccessionLabelProps) {
  const knots = carpet.density ? knotsPerSquareMetre(carpet.density) : null;

  return (
    <aside
      aria-label={`برچسب شیء ${carpet.name}`}
      className={cn("flex flex-col gap-4 bg-card p-5 text-card-foreground shadow-mount", className)}
    >
      <div className="flex items-baseline justify-between gap-4 text-accession text-muted-foreground">
        <span dir="ltr" className="font-mono tracking-wider">
          {accessionNumber(index)}
        </span>
        <span>
          {formatNumber(index + 1)} از {formatNumber(count)}
          {carpet.isPlaceholder ? " · عکس موقت" : ""}
        </span>
      </div>

      <h2 className="font-display text-heading leading-tight font-bold">{carpet.name}</h2>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-spec">
        <dt className="text-muted-foreground">ابعاد</dt>
        <dd>{formatSizeCm(carpet.widthCm, carpet.lengthCm)}</dd>
        <dt className="text-muted-foreground">تراکم</dt>
        <dd>{carpet.density ? formatDensity(carpet.density) : "ثبت نشده"}</dd>
        <dt className="text-muted-foreground">گره در متر مربع</dt>
        <dd className="tabular-nums">
          {knots === null ? "ثبت نشده" : `حدود ${formatNumber(Math.round(knots / 1000) * 1000)}`}
        </dd>
      </dl>

      <fieldset className="flex flex-col gap-2 border-t border-border pt-3">
        <legend className="float-start mb-1 w-full text-label font-semibold">
          همین نقش، با پرز دیگر
        </legend>
        <ToggleGroupPrimitive.Root
          type="single"
          value={material}
          onValueChange={(next) => {
            if (next) onMaterialChange(next as PileMaterial);
          }}
          className="grid grid-cols-3"
          aria-label="جنس پرز"
        >
          {materials.map((m) => (
            <ToggleGroupPrimitive.Item
              key={m}
              value={m}
              className="cursor-pointer border-b-2 border-border py-2 text-sm font-semibold text-muted-foreground transition-colors duration-300 ease-settle hover:text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=on]:border-primary data-[state=on]:text-primary"
            >
              {materialLabels[m]}
            </ToggleGroupPrimitive.Item>
          ))}
        </ToggleGroupPrimitive.Root>
        <p className="min-h-[3.2em] pt-1 text-label text-muted-foreground" aria-live="polite">
          {materialNotes[material]}
        </p>
      </fieldset>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => onStep(-1)}
          className="flex cursor-pointer items-center gap-1 rounded-sm text-sm font-semibold hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
          شیء قبلی
        </button>
        <button
          type="button"
          onClick={() => onStep(1)}
          className="flex cursor-pointer items-center gap-1 rounded-sm text-sm font-semibold hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          شیء بعدی
          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
