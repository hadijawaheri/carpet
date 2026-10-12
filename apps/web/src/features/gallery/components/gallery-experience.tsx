"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { useState } from "react";

import { Collection } from "./collection";
import { Hall } from "./hall";
import { Study } from "./study";

/** The loupe pins the highest-resolution photo, so its zoom shows real knots whatever hangs in the hall. */
const LOUPE_SLUG = "three-medallion";

/** Holds the hall's specimen and material, shared by the hall and the collection rail. */
export function GalleryExperience({ carpets }: { carpets: Carpet[] }) {
  const [index, setIndex] = useState(0);
  const [material, setMaterial] = useState<PileMaterial>(carpets[0]?.material ?? "silk");
  const carpet = carpets[index];
  if (!carpet) return null;
  const loupeCarpet = carpets.find((c) => c.slug === LOUPE_SLUG) ?? carpet;

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
        <Study carpet={loupeCarpet} />
        <Collection carpets={carpets} activeIndex={index} onSelect={show} />
      </main>
    </>
  );
}
