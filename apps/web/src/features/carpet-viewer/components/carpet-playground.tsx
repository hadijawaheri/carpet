"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { CarpetStage } from "./carpet-stage";

const materials: { value: PileMaterial; label: string }[] = [
  { value: "silk", label: "ابریشم" },
  { value: "wool", label: "پشم دستباف" },
  { value: "machine", label: "ماشینی" },
];

/** Skeleton check: one carpet, three feel presets. The landing page replaces it in stage 3. */
export function CarpetPlayground({ carpets }: { carpets: Carpet[] }) {
  const [carpetIndex, setCarpetIndex] = useState(0);
  const [material, setMaterial] = useState<PileMaterial>("silk");
  const carpet = carpets[carpetIndex];
  if (!carpet) return null;

  return (
    <div className="flex flex-col gap-6">
      <CarpetStage carpet={carpet} material={material} className="h-[60dvh] min-h-80 w-full" />
      <div className="flex flex-wrap items-center gap-3">
        {materials.map((m) => (
          <Button
            key={m.value}
            size="sm"
            variant={m.value === material ? "default" : "secondary"}
            aria-pressed={m.value === material}
            onClick={() => setMaterial(m.value)}
          >
            {m.label}
          </Button>
        ))}
        <span className="mx-2 text-muted-foreground">·</span>
        {carpets.map((c, i) => (
          <Button
            key={c.slug}
            size="sm"
            variant={i === carpetIndex ? "default" : "secondary"}
            aria-pressed={i === carpetIndex}
            onClick={() => setCarpetIndex(i)}
          >
            {c.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
