"use client";

import type { Carpet } from "@farsh/contracts";
import Image from "next/image";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";

import { formatNumber } from "@/lib/format";

/** Never magnify past the photo's own pixels: beyond that the lens shows blur, not knots. */
const MAX_ZOOM = 4;
const MIN_ZOOM = 1.5;
const LENS = 176;
const KEY_STEP = 0.04;

/** A conservator's loupe over the carpet photo: the real pixels, magnified, never redrawn. */
export function Loupe({ carpet }: { carpet: Carpet }) {
  const frame = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState({ x: 0.5, y: 0.42 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [naturalWidth, setNaturalWidth] = useState(0);

  useEffect(() => {
    // The lens reads the original file, not a resized next/image variant, so measure that file.
    const img = new window.Image();
    img.onload = () => setNaturalWidth(img.naturalWidth);
    img.src = carpet.image;
    return () => {
      img.onload = null;
    };
  }, [carpet.image]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const measure = () => {
    const box = frame.current?.getBoundingClientRect();
    if (box) setSize({ w: box.width, h: box.height });
    return box;
  };

  const handlePointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = size.w > 0 ? frame.current?.getBoundingClientRect() : measure();
    if (!box) return;
    setPoint({
      x: Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (event.clientY - box.top) / box.height)),
    });
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    measure();
    setPoint((p) => ({
      x: Math.min(1, Math.max(0, p.x + move[0])),
      y: Math.min(1, Math.max(0, p.y + move[1])),
    }));
  };

  const zoom =
    size.w > 0 && naturalWidth > 0
      ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((naturalWidth / size.w) * 10) / 10))
      : MIN_ZOOM;
  const lensX = point.x * size.w;
  const lensY = point.y * size.h;

  return (
    <figure className="flex flex-col gap-3">
      <div
        ref={frame}
        tabIndex={0}
        role="application"
        aria-label={`ذره‌بین روی فرش ${carpet.name}؛ با کلیدهای جهت حرکت دهید`}
        onPointerEnter={measure}
        onPointerMove={handlePointer}
        onPointerDown={(event) => {
          measure();
          handlePointer(event);
        }}
        onKeyDown={handleKey}
        onFocus={measure}
        className="relative cursor-none [touch-action:pan-y] overflow-hidden bg-muted shadow-mount outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        style={{ aspectRatio: carpet.imageAspect }}
      >
        <Image
          src={carpet.image}
          alt={`فرش ${carpet.name}`}
          fill
          sizes="(min-width: 1024px) 40vw, 90vw"
          className="object-cover"
        />
        {size.w > 0 ? (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full border-[3px] border-indigo shadow-[0_18px_30px_-12px_rgb(20_2_4/0.7)]"
            style={{
              width: LENS,
              height: LENS,
              left: lensX - LENS / 2,
              top: lensY - LENS / 2,
              backgroundImage: `url(${carpet.image})`,
              backgroundSize: `${size.w * zoom}px ${size.h * zoom}px`,
              backgroundPosition: `${LENS / 2 - lensX * zoom}px ${LENS / 2 - lensY * zoom}px`,
            }}
          />
        ) : null}
      </div>
      <figcaption className="flex justify-between gap-4 text-label text-on-wall-muted">
        <span>{carpet.name}، زیر ذره‌بین</span>
        <span>بزرگ‌نمایی {formatNumber(zoom)} برابر</span>
      </figcaption>
    </figure>
  );
}
