"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { Hand } from "lucide-react";
import { useState } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { CarpetStage } from "@/features/carpet-viewer";
import { cn } from "@/lib/utils";

import { AccessionLabel } from "./accession-label";

interface HallProps {
  carpets: Carpet[];
  index: number;
  material: PileMaterial;
  onIndexChange: (index: number) => void;
  onMaterialChange: (material: PileMaterial) => void;
}

export function Hall({ carpets, index, material, onIndexChange, onMaterialChange }: HallProps) {
  const [touched, setTouched] = useState(false);
  const carpet = carpets[index];
  if (!carpet) return null;

  return (
    <section id="hall" aria-labelledby="hall-title" className="relative isolate overflow-hidden">
      {/* The gallery spot pools on the wall behind the carpet and falls off towards the skirting. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_48%_58%_at_36%_34%,var(--wall-lit),transparent_74%),linear-gradient(to_bottom,transparent_82%,var(--wall-deep))]"
      />
      <SiteHeader />

      {/* RTL reading starts at the right, so the inscription and label lead there and the carpet hangs to their left. */}
      <div className="grid min-h-[calc(100svh-5rem)] grid-cols-[minmax(0,1fr)] [grid-template-areas:'title'_'stage'_'label'] lg:grid-cols-[minmax(20rem,25rem)_minmax(0,1fr)] lg:grid-rows-[1fr_auto] lg:gap-x-10 lg:ps-10 lg:[grid-template-areas:'title_stage'_'label_stage']">
        <div className="relative min-h-[66svh] [grid-area:stage] lg:min-h-0">
          <CarpetStage
            carpet={carpet}
            material={material}
            variant="gallery"
            onGrab={() => setTouched(true)}
            className="absolute inset-0"
          />
          <p
            className={cn(
              "pointer-events-none absolute inset-x-4 bottom-6 flex items-center justify-center gap-2 text-label text-on-wall-muted transition-opacity duration-700 ease-settle",
              touched && "opacity-0",
            )}
          >
            <Hand className="size-4 text-saffron" aria-hidden />
            گوشه‌ی پایین فرش را بگیرید، بالا بیاورید و رها کنید.
          </p>
        </div>

        <div className="flex flex-col gap-5 px-4 pt-10 pb-4 [grid-area:title] sm:px-10 lg:px-0 lg:pt-[7svh]">
          <h1 id="hall-title" className="font-display text-inscription font-bold">
            لطفاً دست <span className="text-saffron">بزنید</span>.
          </h1>
          <p className="max-w-[34ch] text-lead text-on-wall-muted">
            در این تالار، برخلاف هر موزه‌ای، فرش را می‌شود گرفت. بلندش کنید تا پشتش را ببینید و جنسش
            را عوض کنید تا افتادنش عوض شود.
          </p>
        </div>

        <div className="px-4 pt-4 pb-10 [grid-area:label] sm:px-10 lg:px-0 lg:pt-6 lg:pb-8">
          <AccessionLabel
            carpet={carpet}
            index={index}
            count={carpets.length}
            material={material}
            onMaterialChange={onMaterialChange}
            onStep={(step) => onIndexChange((index + step + carpets.length) % carpets.length)}
          />
        </div>
      </div>
    </section>
  );
}
