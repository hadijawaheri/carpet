"use client";

import { useId } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ChoiceProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** One option out of a few. Radix lets a pressed item be unpressed; a room setting always has a value, so that is ignored. */
export function Choice<T extends string>({ label, value, options, onChange }: ChoiceProps<T>) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-label font-semibold">
        {label}
      </span>
      <ToggleGroup
        type="single"
        value={value}
        aria-labelledby={labelId}
        onValueChange={(next) => {
          const picked = options.find((option) => option.value === next);
          if (picked) onChange(picked.value);
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} size="sm">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
