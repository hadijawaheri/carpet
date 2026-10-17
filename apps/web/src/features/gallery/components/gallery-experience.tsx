"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { type ReactNode, useState } from "react";

import { Collection } from "./collection";
import { Hall } from "./hall";
import { Study } from "./study";

/** Holds the hall's specimen and material, shared by the hall, the loupe and the collection rail. */
export function GalleryExperience({ carpets, after }: { carpets: Carpet[]; after: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [material, setMaterial] = useState<PileMaterial>(carpets[0]?.material ?? "silk");
  const carpet = carpets[index];
  if (!carpet) return null;

  const show = (next: number) => {
    setIndex(next);
    setMaterial(carpets[next]?.material ?? "silk");
  };

  return (
    <>
      <Hall
        carpets={carpets}
        index={index}
        material={material}
        onIndexChange={show}
        onMaterialChange={setMaterial}
      />
      <main>
        <Study carpet={carpet} />
        <Collection carpets={carpets} activeIndex={index} onSelect={show} />
        {after}
      </main>
    </>
  );
}
