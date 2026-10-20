"use client";

import type { Carpet } from "@farsh/contracts";
import { Eye, Heart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { materialLabels } from "@/features/carpet-viewer";
import { formatDensity } from "@/lib/density";
import { formatPriceRial, formatSizeCm } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useShowroom } from "./showroom-store";

/** Gallery card with the design's knot-level zoom: hovering magnifies the photo around the pointer. */
export function CarpetCard({ carpet, index }: { carpet: Carpet; index: number }) {
  const { wishlist, toggleWish, setQuickView } = useShowroom();
  const [zoom, setZoom] = useState({ x: 50, y: 50, on: false });
  const wished = wishlist.includes(carpet.slug);

  return (
    <article className="group animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
      <div
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({
            x: ((e.clientX - r.left) / r.width) * 100,
            y: ((e.clientY - r.top) / r.height) * 100,
            on: true,
          });
        }}
        onPointerLeave={() => setZoom((z) => ({ ...z, on: false }))}
        className="relative aspect-[3/4] overflow-hidden bg-alabaster p-6 transition duration-500 group-hover:-translate-y-2 group-hover:shadow-lift"
      >
        <div className="relative size-full">
          <Image
            src={carpet.image}
            alt={`فرش ${carpet.name}`}
            fill
            sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-contain transition-transform duration-300"
            style={{
              transformOrigin: `${zoom.x}% ${zoom.y}%`,
              transform: zoom.on ? "scale(2.2)" : "scale(1)",
            }}
          />
        </div>
        <button
          type="button"
          aria-label={
            wished ? `حذف ${carpet.name} از برگزیده‌ها` : `افزودن ${carpet.name} به برگزیده‌ها`
          }
          aria-pressed={wished}
          onClick={() => toggleWish(carpet.slug)}
          className="absolute end-3 top-3 rounded-full bg-card/80 p-2 backdrop-blur"
        >
          <Heart className={cn("size-4", wished && "fill-madder text-madder")} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setQuickView(carpet)}
          className="absolute inset-x-4 bottom-4 flex translate-y-3 items-center justify-center gap-2 bg-card/90 py-2.5 text-xs opacity-0 backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 max-md:translate-y-0 max-md:opacity-100"
        >
          <Eye className="size-4" aria-hidden /> نگاه سریع
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <p className="eyebrow text-gold-text">{materialLabels[carpet.material]}</p>
          <h3 className="mt-1 text-2xl">{carpet.name}</h3>
          <p className="mt-1 flex flex-wrap gap-x-1.5 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">
              {formatSizeCm(carpet.widthCm, carpet.lengthCm)}
            </span>
            {carpet.density ? (
              <span className="whitespace-nowrap">· {formatDensity(carpet.density)}</span>
            ) : null}
          </p>
        </div>
        <p className="shrink-0 font-display text-lg">{formatPriceRial(carpet.priceRial)}</p>
      </div>
    </article>
  );
}
