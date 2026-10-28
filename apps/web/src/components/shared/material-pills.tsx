"use client";

import { ToggleGroup } from "radix-ui";

import { cn } from "@/lib/utils";

interface PillOption<T extends string> {
  value: T;
  label: string;
}

/** The design's rounded filter chips, as a single-choice Radix toggle group (arrow keys, RTL aware). */
export function MaterialPills<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: PillOption<T>[];
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      // Radix sends "" when the active chip is pressed again; one option always stays chosen.
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
      aria-label={label}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className="cursor-pointer rounded-full border px-4 py-1.5 text-xs transition hover:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=on]:border-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
