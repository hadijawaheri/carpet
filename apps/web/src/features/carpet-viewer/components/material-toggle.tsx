"use client";

import type { PileMaterial } from "@farsh/contracts";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { materialLabels } from "../material-labels";

const order: PileMaterial[] = ["silk", "wool", "machine"];

export function MaterialToggle({
  value,
  onValueChange,
  size,
}: {
  value: PileMaterial;
  onValueChange: (material: PileMaterial) => void;
  size?: "default" | "sm";
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      // Radix sends "" when the active item is pressed again; a carpet always has a material.
      onValueChange={(next) => {
        if (next) onValueChange(next as PileMaterial);
      }}
      aria-label="جنس پرز"
    >
      {order.map((m) => (
        <ToggleGroupItem key={m} value={m} size={size}>
          {materialLabels[m]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
