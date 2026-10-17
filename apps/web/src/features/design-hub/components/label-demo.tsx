"use client";

import type { PileMaterial } from "@farsh/contracts";
import { useState } from "react";

import { carpets } from "@/features/catalog";
import { AccessionLabel } from "@/features/gallery";

export function LabelDemo() {
  const [index, setIndex] = useState(0);
  const [material, setMaterial] = useState<PileMaterial>(carpets[0]?.material ?? "silk");
  const carpet = carpets[index];
  if (!carpet) return null;
  return (
    <AccessionLabel
      carpet={carpet}
      index={index}
      count={carpets.length}
      material={material}
      onMaterialChange={setMaterial}
      onStep={(step) => {
        const next = (index + step + carpets.length) % carpets.length;
        setIndex(next);
        setMaterial(carpets[next]?.material ?? "silk");
      }}
    />
  );
}
