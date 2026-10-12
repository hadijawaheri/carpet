import { hexToHsl, hslToHex, reshape, rgbToHex } from "./color";

export interface Swatch {
  hex: string;
  /** Share of the picture's opaque pixels, 0–1. */
  share: number;
}

/** A whole room's colours, derived from one carpet photo. */
export interface RoomPalette {
  id: string;
  label: string;
  wall: string;
  sofa: string;
  curtain: string;
  table: string;
  frame: string;
  paintingFill: string;
  paintingAccent: string;
}

const BUCKET_BITS = 4;
/** Two swatches closer than this in RGB are the same colour to the eye, so the weaker one is dropped. */
const MIN_DISTANCE = 52;

/**
 * Finds the colours a picture is mostly made of. Pixels are grouped into coarse colour buckets,
 * each bucket keeps its true average, and near-duplicates are merged into the heavier one.
 */
export function dominantColors(
  pixels: ArrayLike<number>,
  count: number,
  { sampleStride = 1 }: { sampleStride?: number } = {},
): Swatch[] {
  const shift = 8 - BUCKET_BITS;
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  let total = 0;
  for (let i = 0; i + 3 < pixels.length; i += 4 * sampleStride) {
    if (pixels[i + 3]! < 128) continue;
    const r = pixels[i]!;
    const g = pixels[i + 1]!;
    const b = pixels[i + 2]!;
    const key = ((r >> shift) << (BUCKET_BITS * 2)) | ((g >> shift) << BUCKET_BITS) | (b >> shift);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.n += 1;
    buckets.set(key, bucket);
    total += 1;
  }
  if (total === 0) return [];

  const ranked = [...buckets.values()]
    .map((b) => ({ r: b.r / b.n, g: b.g / b.n, b: b.b / b.n, n: b.n }))
    .sort((a, b) => b.n - a.n);

  const kept: { r: number; g: number; b: number; n: number }[] = [];
  for (const candidate of ranked) {
    const twin = kept.find(
      (k) => Math.hypot(k.r - candidate.r, k.g - candidate.g, k.b - candidate.b) < MIN_DISTANCE,
    );
    if (twin) twin.n += candidate.n;
    else kept.push({ ...candidate });
  }
  return kept
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((k) => ({ hex: rgbToHex(k), share: k.n / total }));
}

/** The swatch that best stands for the carpet: heavy, and coloured rather than grey. */
export function mainColor(swatches: Swatch[]): string {
  let best = swatches[0]?.hex ?? "#8a2a2e";
  let bestScore = -1;
  for (const swatch of swatches) {
    const { s, l } = hexToHsl(swatch.hex);
    const score = swatch.share * (0.15 + s) * (1 - Math.abs(l - 0.45));
    if (score > bestScore) {
      bestScore = score;
      best = swatch.hex;
    }
  }
  return best;
}

const NEUTRAL_FRAME = "#2a1b14";
const WOOD = "#3b2a20";

/** Four ways to dress a room around one carpet. Each is a starting point the visitor then edits. */
export function suggestPalettes(swatches: Swatch[]): RoomPalette[] {
  const main = mainColor(swatches);
  const { h, s } = hexToHsl(main);
  const second =
    swatches.find((w) => Math.abs(hexToHsl(w.hex).h - h) > 25 && hexToHsl(w.hex).s > 0.15)?.hex ??
    reshape(main, { h: 30 });
  const soft = Math.min(0.3, Math.max(0.08, s * 0.28));

  return [
    {
      id: "tonal",
      label: "هم‌رنگ فرش",
      wall: hslToHex({ h, s: soft, l: 0.88 }),
      sofa: hslToHex({ h, s: Math.min(0.5, s * 0.5), l: 0.42 }),
      curtain: hslToHex({ h, s: soft + 0.05, l: 0.78 }),
      table: WOOD,
      frame: NEUTRAL_FRAME,
      paintingFill: hslToHex({ h, s: soft, l: 0.8 }),
      paintingAccent: main,
    },
    {
      id: "complement",
      label: "مکمل فرش",
      wall: hslToHex({ h, s: 0.1, l: 0.9 }),
      sofa: hslToHex({ h: h + 180, s: Math.min(0.3, s * 0.4), l: 0.42 }),
      curtain: hslToHex({ h: h + 180, s: 0.25, l: 0.76 }),
      table: WOOD,
      frame: NEUTRAL_FRAME,
      paintingFill: hslToHex({ h: h + 180, s: 0.2, l: 0.84 }),
      paintingAccent: main,
    },
    {
      id: "calm",
      label: "آرام و روشن",
      wall: hslToHex({ h: 38, s: 0.28, l: 0.92 }),
      sofa: hslToHex({ h: 32, s: 0.1, l: 0.62 }),
      curtain: hslToHex({ h: 38, s: 0.25, l: 0.85 }),
      table: "#5a4636",
      frame: NEUTRAL_FRAME,
      paintingFill: hslToHex({ h: 38, s: 0.25, l: 0.86 }),
      paintingAccent: second,
    },
    {
      id: "deep",
      label: "تیره و باوقار",
      wall: hslToHex({ h, s: Math.min(0.4, s * 0.6), l: 0.24 }),
      sofa: hslToHex({ h: 38, s: 0.3, l: 0.82 }),
      curtain: hslToHex({ h, s: Math.min(0.4, s * 0.55), l: 0.3 }),
      table: "#d8c9ae",
      frame: "#c9a35a",
      paintingFill: hslToHex({ h, s: 0.3, l: 0.16 }),
      paintingAccent: second,
    },
  ];
}
