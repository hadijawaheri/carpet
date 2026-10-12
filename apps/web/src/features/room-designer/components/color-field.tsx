"use client";

import { Palette } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/utils";

import type { SwatchOption } from "../data/catalog";

interface ColorFieldProps {
  label: string;
  value: string;
  swatches: SwatchOption[];
  onChange: (hex: string) => void;
}

/** Ready-made colours plus a free picker: any taste can reach its colour, nobody is held to a list. */
export function ColorField({ label, value, swatches, onChange }: ColorFieldProps) {
  const labelId = useId();
  const current = value.toLowerCase();
  const named = swatches.find((s) => s.hex.toLowerCase() === current);

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="text-label font-semibold">
          {label}
        </span>
        <span className="flex items-baseline gap-2 text-accession text-muted-foreground">
          {named?.label ?? "رنگ دلخواه"}
          <bdi dir="ltr" className="font-mono">
            {current}
          </bdi>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {swatches.map((swatch) => {
          const selected = swatch.hex.toLowerCase() === current;
          return (
            <button
              key={swatch.hex}
              type="button"
              aria-label={swatch.label}
              aria-pressed={selected}
              title={swatch.label}
              onClick={() => onChange(swatch.hex)}
              style={{ backgroundColor: swatch.hex }}
              className={cn(
                "size-8 cursor-pointer rounded-full border border-input/40 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                selected && "ring-2 ring-primary ring-offset-2 ring-offset-card",
              )}
            />
          );
        })}
        <label
          title="رنگ دلخواه"
          className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-input text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card hover:text-card-foreground"
        >
          <Palette aria-hidden className="size-4" />
          <input
            type="color"
            value={current}
            aria-label={`${label}: رنگ دلخواه`}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
