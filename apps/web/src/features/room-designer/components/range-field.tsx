"use client";

import { useId, useState } from "react";

import { Slider } from "@/components/ui/slider";

interface RangeFieldProps {
  label: string;
  /** The current value as the visitor reads it, with its unit. */
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  /** `group` stays the same for one drag of the thumb, so the whole drag is one undo step. */
  onChange: (value: number, group: string) => void;
  /** Positions run left to right as the room is seen, whatever the page's direction. */
  dir?: "ltr" | "rtl";
}

export function RangeField({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
  dir,
}: RangeFieldProps) {
  const id = useId();
  const [gesture, setGesture] = useState(0);
  const group = `${id}-${gesture}`;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3 text-label font-semibold">
        <span>{label}</span>
        <span className="font-normal text-muted-foreground tabular-nums">{valueLabel}</span>
      </div>
      <Slider
        label={label}
        dir={dir}
        min={min}
        max={max}
        step={step}
        value={[Math.min(max, Math.max(min, value))]}
        onValueChange={([next]) => {
          if (next !== undefined) onChange(next, group);
        }}
        onValueCommit={() => setGesture((n) => n + 1)}
      />
    </div>
  );
}

const RADIANS = 180 / Math.PI;

/** Degrees between −180 and 180, as a turn reads to a person. */
export function toDegrees(radians: number) {
  const degrees = Math.round(radians * RADIANS) % 360;
  return degrees > 180 ? degrees - 360 : degrees < -180 ? degrees + 360 : degrees;
}

export const toRadians = (degrees: number) => degrees / RADIANS;
