"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { useState } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { CarpetStage } from "./carpet-stage";
import { MaterialToggle } from "./material-toggle";

/** Skeleton check: one carpet, three feel presets. The landing page replaces it in stage 3. */
export function CarpetPlayground({ carpets }: { carpets: Carpet[] }) {
  const [slug, setSlug] = useState(carpets[0]?.slug ?? "");
  const [material, setMaterial] = useState<PileMaterial>("silk");
  const carpet = carpets.find((c) => c.slug === slug);
  if (!carpet) return null;

  return (
    <div className="flex flex-col gap-6">
      <CarpetStage carpet={carpet} material={material} className="h-[60dvh] min-h-80 w-full" />
      <div className="flex flex-wrap items-center gap-3">
        <MaterialToggle value={material} onValueChange={setMaterial} size="sm" />
        <span className="mx-2 text-muted-foreground" aria-hidden>
          ·
        </span>
        <ToggleGroup
          type="single"
          value={slug}
          onValueChange={(next) => {
            if (next) setSlug(next);
          }}
          aria-label="طرح فرش"
        >
          {carpets.map((c) => (
            <ToggleGroupItem key={c.slug} value={c.slug} size="sm">
              {c.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
