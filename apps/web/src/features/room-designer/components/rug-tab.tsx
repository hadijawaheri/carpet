"use client";

import type { Carpet, PileMaterial, RoomLayout } from "@farsh/contracts";
import { Eraser, RotateCw } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { materialLabels } from "@/features/carpet-viewer/material-labels";
import { formatNumber, formatSizeCm } from "@/lib/format";
import { suggestPalettes } from "@/lib/image-palette";
import { cn } from "@/lib/utils";

import { rugSizes } from "../data/catalog";
import { useCarpetSwatches } from "../hooks/use-carpet-swatches";
import { rugSize } from "../state/room-geometry";
import type { RoomAction } from "../state/room-reducer";
import { RangeField, toDegrees, toRadians } from "./range-field";

interface RugTabProps {
  layout: RoomLayout;
  carpets: Carpet[];
  carpet: Carpet;
  dispatch: (action: RoomAction) => void;
  onFlatten: () => void;
}

/** What each pile does in the room, in the terms the simulation actually differs by. */
const materialNotes: Record<PileMaterial, string> = {
  silk: "نازک و سبک؛ نور را برمی‌گرداند و نرم تا می‌خورد.",
  wool: "پرز بلند و لبه‌ی ضخیم؛ مات و گرم.",
  machine: "پرز کوتاه‌تر و لبه‌ی نازک‌تر از دستباف پشمی؛ یکدست و مات.",
};

const materials = Object.keys(materialLabels) as PileMaterial[];

export function RugTab({ layout, carpets, carpet, dispatch, onFlatten }: RugTabProps) {
  const { rug } = layout;
  const size = rugSize(rug, carpet);
  const swatches = useCarpetSwatches(carpet.image);
  const palettes = swatches ? suggestPalettes(swatches) : [];
  // Tableaux hang on walls; the floor takes rugs.
  const rugs = carpets.filter((c) => c.kind === "rug");
  const presets = carpet.isPlaceholder
    ? rugSizes
    : [...rugSizes, { label: "اندازه‌ی واقعی", lengthCm: carpet.lengthCm }];

  return (
    <>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-label font-semibold">طرح فرش</legend>
        <div className="grid grid-cols-5 gap-2">
          {rugs.map((option) => {
            const selected = option.slug === carpet.slug;
            return (
              <button
                key={option.slug}
                type="button"
                aria-pressed={selected}
                aria-label={option.name}
                title={option.name}
                onClick={() =>
                  dispatch({
                    type: "rug",
                    patch: { carpet: option.slug, material: option.material },
                  })
                }
                className={cn(
                  "relative aspect-[3/4] cursor-pointer overflow-hidden rounded-sm border border-input/40 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  selected && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                )}
              >
                <Image src={option.image} alt="" fill sizes="64px" className="object-cover" />
              </button>
            );
          })}
        </div>
        <p className="text-label text-muted-foreground">
          {carpet.name}
          {carpet.isPlaceholder ? " (اندازه و جنس این عکس هنوز نمونه است)" : ""}
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-label font-semibold">نوع بافت</legend>
        <div className="grid gap-2">
          {materials.map((material) => {
            const selected = rug.material === material;
            return (
              <button
                key={material}
                type="button"
                aria-pressed={selected}
                onClick={() => dispatch({ type: "rug", patch: { material } })}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-0.5 rounded-sm border border-input/40 px-3 py-2 text-start outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "border-primary bg-secondary",
                )}
              >
                <span className="text-sm font-semibold">{materialLabels[material]}</span>
                <span className="text-accession text-muted-foreground">
                  {materialNotes[material]}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <section aria-labelledby="rug-size-title" className="flex flex-col gap-3">
        <h3 id="rug-size-title" className="flex items-baseline justify-between gap-3">
          <span className="text-base font-bold">اندازه</span>
          <span className="text-label text-muted-foreground tabular-nums">
            {formatSizeCm(Math.round(size.width * 100), Math.round(size.length * 100))}
          </span>
        </h3>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="اندازه‌های رایج">
          {presets.map((preset) => {
            const selected = Math.round(rug.lengthCm) === preset.lengthCm;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={selected}
                onClick={() => dispatch({ type: "rug", patch: { lengthCm: preset.lengthCm } })}
                className={cn(
                  "h-8 cursor-pointer rounded-sm border border-input/40 px-2.5 text-xs font-semibold outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <RangeField
          label="طول فرش"
          valueLabel={`${formatNumber(Math.round(rug.lengthCm))} سانتی‌متر`}
          min={60}
          max={600}
          step={5}
          value={rug.lengthCm}
          onChange={(lengthCm, group) => dispatch({ type: "rug", patch: { lengthCm }, group })}
        />
        <p className="text-accession text-muted-foreground">
          پهنا از نسبت عکس می‌آید تا نقش فرش کشیده نشود. نام‌ها اندازه‌ی تقریبی بازارند.
        </p>
      </section>

      <section aria-labelledby="rug-turn-title" className="flex flex-col gap-3">
        <h3 id="rug-turn-title" className="text-base font-bold">
          چرخش و حالت
        </h3>
        <RangeField
          label="زاویه"
          valueLabel={`${formatNumber(toDegrees(rug.rotation))} درجه`}
          min={-180}
          max={180}
          step={1}
          value={toDegrees(rug.rotation)}
          onChange={(degrees, group) =>
            dispatch({ type: "rug", patch: { rotation: toRadians(degrees) }, group })
          }
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="mount"
            size="sm"
            className="border border-input/40"
            onClick={() =>
              dispatch({
                type: "rug",
                patch: { rotation: toRadians(toDegrees(rug.rotation + Math.PI / 2)) },
              })
            }
          >
            <RotateCw aria-hidden />
            ۹۰ درجه
          </Button>
          <Button
            type="button"
            variant="mount"
            size="sm"
            className="border border-input/40"
            onClick={onFlatten}
          >
            <Eraser aria-hidden />
            صاف کردن فرش
          </Button>
        </div>
        <p className="text-accession text-muted-foreground">
          در حالت «لمس فرش» گوشه‌ای را بگیرید و روی خودش تا کنید؛ همان‌جا می‌ماند تا صافش کنید.
        </p>
      </section>

      <section aria-labelledby="palette-title" className="flex flex-col gap-3">
        <h3 id="palette-title" className="text-base font-bold">
          اتاق را از رنگ‌های این فرش بسازید
        </h3>
        {swatches === null ? (
          <p className="text-label text-muted-foreground" role="status">
            در حال خواندن رنگ‌های فرش…
          </p>
        ) : palettes.length === 0 ? (
          <p className="text-label text-muted-foreground">رنگ‌های این عکس خوانده نشد.</p>
        ) : (
          <>
            <ul className="flex h-6 overflow-hidden rounded-sm" aria-label="رنگ‌های فرش">
              {swatches.map((swatch) => (
                <li
                  key={swatch.hex}
                  title={swatch.hex}
                  style={{ backgroundColor: swatch.hex, flexGrow: swatch.share }}
                />
              ))}
            </ul>
            <ul className="grid gap-2">
              {palettes.map((palette) => (
                <li key={palette.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "palette", palette })}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm border border-input/40 bg-card px-3 py-2 text-start text-sm font-semibold outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {palette.label}
                    <span aria-hidden className="flex">
                      {[
                        palette.wall,
                        palette.sofa,
                        palette.curtain,
                        palette.table,
                        palette.paintingAccent,
                      ].map((color, index) => (
                        <span
                          key={`${color}-${index}`}
                          className="-me-1.5 size-6 rounded-full border border-card"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-accession text-muted-foreground">
              هر طرح فقط شروع کار است؛ بعد از آن هر رنگ را خودتان عوض کنید.
            </p>
          </>
        )}
      </section>
    </>
  );
}
