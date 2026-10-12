"use client";

import type { Carpet, PileMaterial, RoomLayout } from "@farsh/contracts";
import { RotateCw } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { materialLabels } from "@/features/carpet-viewer/material-labels";
import { formatSizeCm } from "@/lib/format";
import { suggestPalettes } from "@/lib/image-palette";
import { cn } from "@/lib/utils";

import { useCarpetSwatches } from "../hooks/use-carpet-swatches";
import { rugSize } from "../state/room-geometry";
import type { RoomAction } from "../state/room-reducer";

interface RugTabProps {
  layout: RoomLayout;
  carpets: Carpet[];
  carpet: Carpet;
  dispatch: (action: RoomAction) => void;
}

const materials = Object.keys(materialLabels) as PileMaterial[];

export function RugTab({ layout, carpets, carpet, dispatch }: RugTabProps) {
  const { rug } = layout;
  const size = rugSize(rug, carpet);
  const swatches = useCarpetSwatches(carpet.image);
  const palettes = swatches ? suggestPalettes(swatches) : [];

  return (
    <>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-label font-semibold">فرش را انتخاب کنید</legend>
        <div className="grid grid-cols-5 gap-2">
          {carpets.map((option) => {
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
          {carpet.name}؛ {formatSizeCm(Math.round(size.width * 100), Math.round(size.length * 100))}
          {carpet.isPlaceholder ? " (اندازه و جنس هنوز نمونه است)" : ""}
        </p>
      </fieldset>

      <div className="flex flex-col gap-2">
        <span id="rug-material" className="text-label font-semibold">
          جنس فرش
        </span>
        <ToggleGroup
          type="single"
          value={rug.material}
          aria-labelledby="rug-material"
          onValueChange={(next) => {
            const picked = materials.find((m) => m === next);
            if (picked) dispatch({ type: "rug", patch: { material: picked } });
          }}
        >
          {materials.map((material) => (
            <ToggleGroupItem key={material} value={material} size="sm">
              {materialLabels[material]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-accession text-muted-foreground">
          جنس روی برق و سنگینی پارچه‌ی فرش اثر می‌گذارد؛ ابریشم سبک‌تر می‌افتد و می‌درخشد.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between text-label font-semibold">
          <span>اندازه</span>
          <span className="text-muted-foreground">
            {Math.round(rug.scale * 100).toLocaleString("fa-IR")}٪ نمونه
          </span>
        </div>
        <Slider
          label="اندازه‌ی فرش"
          min={0.6}
          max={1.6}
          step={0.05}
          value={[rug.scale]}
          onValueChange={([scale]) =>
            scale !== undefined && dispatch({ type: "rug", patch: { scale } })
          }
        />
        <Button
          type="button"
          variant="mount"
          size="sm"
          className="mt-2 w-fit border border-input/40"
          onClick={() =>
            dispatch({
              type: "rug",
              patch: { rotation: (rug.rotation + Math.PI / 2) % (2 * Math.PI) },
            })
          }
        >
          <RotateCw aria-hidden />
          فرش را بچرخانید
        </Button>
      </div>

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
