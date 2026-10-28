"use client";

import type { KnotDensity } from "@farsh/contracts";
import { useState } from "react";

import { MaterialPills } from "@/components/shared/material-pills";
import {
  knotsPerSquareInch,
  knotsPerSquareMetre,
  rajKnotSpacingMm,
  totalKnots,
} from "@/lib/density";
import { formatNumber } from "@/lib/format";

import { parseCount } from "../parse-count";
import { CountField } from "./count-field";

type Construction = "hand" | "machine";

// Wide enough for any carpet sold, narrow enough to catch a slipped digit
const RANGES = {
  raj: [10, 150],
  shaneh: [100, 2000],
  takham: [100, 10_000],
  size: [30, 2000],
} as const;

const spacing = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 });

export function KnotCalculator() {
  const [construction, setConstruction] = useState<Construction>("hand");
  const [raj, setRaj] = useState("50");
  const [shaneh, setShaneh] = useState("1200");
  const [takham, setTakham] = useState("3600");
  const [width, setWidth] = useState("200");
  const [length, setLength] = useState("300");

  const parsed = {
    raj: parseCount(raj, ...RANGES.raj),
    shaneh: parseCount(shaneh, ...RANGES.shaneh),
    takham: parseCount(takham, ...RANGES.takham),
    width: parseCount(width, ...RANGES.size),
    length: parseCount(length, ...RANGES.size),
  };

  const hand = construction === "hand";
  let density: KnotDensity | null = null;
  if (hand && parsed.raj.ok) density = { unit: "raj", value: parsed.raj.value };
  if (!hand && parsed.shaneh.ok && parsed.takham.ok) {
    density = { unit: "shaneh", value: parsed.shaneh.value, takham: parsed.takham.value };
  }
  const perSquareMetre = density ? knotsPerSquareMetre(density) : null;
  // Machine points are not knots (the loom threads the pile through), so the results say so
  const unit = hand ? "گره" : "نقطه‌ی پرز";
  const about = hand ? "حدود " : "";

  const results: [string, string][] = [];
  if (perSquareMetre !== null) {
    results.push(
      [`${unit} در هر متر مربع`, `${about}${formatNumber(perSquareMetre)}`],
      [`${unit} در هر اینچ مربع`, `${about}${formatNumber(knotsPerSquareInch(perSquareMetre))}`],
    );
    if (parsed.width.ok && parsed.length.ok) {
      results.push([
        hand ? "کل گره‌های فرش" : "کل نقطه‌های پرز فرش",
        `${about}${formatNumber(totalKnots(perSquareMetre, parsed.width.value, parsed.length.value))}`,
      ]);
    }
    if (density?.unit === "raj") {
      results.push([
        "فاصله‌ی دو گره در عرض",
        `${spacing.format(rajKnotSpacingMm(density.value))} میلی‌متر`,
      ]);
    }
  }

  return (
    <div className="grid gap-10 border bg-card p-6 sm:p-10 md:grid-cols-2">
      <div className="flex flex-col gap-6">
        <MaterialPills
          label="نوع بافت"
          value={construction}
          onChange={setConstruction}
          options={[
            { value: "hand", label: "دستباف، با رج" },
            { value: "machine", label: "ماشینی، با شانه و تراکم" },
          ]}
        />
        {hand ? (
          <CountField
            id="calc-raj"
            label="رج"
            hint="شمار گره‌ها در هفت سانتی‌متر از عرض فرش"
            value={raj}
            parsed={parsed.raj}
            onChange={setRaj}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <CountField
              id="calc-shaneh"
              label="شانه"
              hint="نقطه‌ها در یک متر از عرض"
              value={shaneh}
              parsed={parsed.shaneh}
              onChange={setShaneh}
            />
            <CountField
              id="calc-takham"
              label="تراکم"
              hint="نقطه‌ها در یک متر از طول"
              value={takham}
              parsed={parsed.takham}
              onChange={setTakham}
            />
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          <CountField
            id="calc-width"
            label="عرض فرش (سانتی‌متر)"
            value={width}
            parsed={parsed.width}
            onChange={setWidth}
          />
          <CountField
            id="calc-length"
            label="طول فرش (سانتی‌متر)"
            value={length}
            parsed={parsed.length}
            onChange={setLength}
          />
        </div>
      </div>

      <div aria-live="polite" className="flex flex-col gap-4">
        <h2 className="text-2xl">نتیجه</h2>
        {results.length > 0 ? (
          <dl className="grid gap-4">
            {results.map(([term, value]) => (
              <div key={term} className="border-b pb-3">
                <dt className="eyebrow text-muted-foreground">{term}</dt>
                <dd className="mt-1 font-display text-3xl tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            برای دیدن نتیجه، {hand ? "رج" : "شانه و تراکم"} را درست وارد کنید.
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          {hand
            ? "رج فقط عرض را می‌شمارد؛ این حساب فرض می‌کند گره‌ها در طول هم همان‌قدر فشرده‌اند، پس عددها تخمین‌اند."
            : "شانه ضرب در تراکم، شمار دقیق نقطه‌ها را می‌دهد. این نقطه‌ها گره‌ی واقعی نیستند و با رج فرش دستباف هم‌سنگ نیستند."}
        </p>
      </div>
    </div>
  );
}
