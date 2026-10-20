/** Rooms are modelled in metres: x runs along the back wall, z towards the viewer, y up from the floor. */
export type RoomType = "living" | "salon" | "bedroom" | "dining" | "office";
export type FloorKind = "oak" | "walnut-herringbone" | "marble" | "travertine" | "microcement";
export type LightMode = "day" | "golden" | "night";

export interface RoomDimensions {
  width: number;
  length: number;
  height: number;
}

export interface RoomConfig extends RoomDimensions {
  type: RoomType;
  wall: string;
  floor: FloorKind;
  light: LightMode;
}

interface RoomTypePreset {
  label: string;
  dimensions: RoomDimensions;
  wall: string;
  floor: FloorKind;
  /** A carpet below this share of the floor reads as a doormat in this kind of room. */
  minCoverage: number;
}

export const roomTypes: Record<RoomType, RoomTypePreset> = {
  living: {
    label: "نشیمن",
    dimensions: { width: 4.6, length: 5.6, height: 2.8 },
    wall: "#e6dccb",
    floor: "oak",
    minCoverage: 0.14,
  },
  salon: {
    label: "سالن پذیرایی",
    dimensions: { width: 7, length: 10, height: 3.3 },
    wall: "#efebe4",
    floor: "marble",
    minCoverage: 0.08,
  },
  bedroom: {
    label: "اتاق خواب",
    dimensions: { width: 3.8, length: 4.4, height: 2.7 },
    wall: "#cfc6ba",
    floor: "walnut-herringbone",
    minCoverage: 0.12,
  },
  dining: {
    label: "ناهارخوری",
    dimensions: { width: 4.2, length: 5, height: 2.8 },
    wall: "#e6dccb",
    floor: "travertine",
    minCoverage: 0.16,
  },
  office: {
    label: "اتاق کار",
    dimensions: { width: 3.6, length: 4.2, height: 2.7 },
    wall: "#7f8f9a",
    floor: "walnut-herringbone",
    minCoverage: 0.1,
  },
};

export const roomTypeOrder: RoomType[] = ["living", "salon", "bedroom", "dining", "office"];

type DimensionLimits = Record<keyof RoomDimensions, { min: number; max: number }>;

const baseLimits: DimensionLimits = {
  width: { min: 3, max: 10 },
  length: { min: 3.2, max: 14 },
  height: { min: 2.5, max: 4.2 },
};

/** Slider bounds; the smallest room still fits its layout's furniture without overlaps. */
export function dimensionLimits(type: RoomType): DimensionLimits {
  if (type !== "salon") return baseLimits;
  // A salon is the formal hall: seating and an eight-seat table need a big floor.
  return {
    width: { min: 5.5, max: 12 },
    length: { min: 7.5, max: 16 },
    height: { min: 2.8, max: 4.5 },
  };
}

export const wallPaints = [
  { value: "#efebe4", label: "سفید گچی" },
  { value: "#e6dccb", label: "کرم گرم" },
  { value: "#cfc6ba", label: "خاکستری گرم" },
  { value: "#b9a68a", label: "کاهگلی" },
  { value: "#8c8f6e", label: "سبز زیتونی" },
  { value: "#7f8f9a", label: "آبی دودی" },
  { value: "#b9785a", label: "سفالی" },
  { value: "#2f3a4a", label: "سرمه‌ای" },
] as const;

export const floorKinds: Record<FloorKind, { label: string; swatch: string }> = {
  oak: { label: "پارکت بلوط", swatch: "#c19a6b" },
  "walnut-herringbone": { label: "جناغی گردو", swatch: "#6f4a32" },
  marble: { label: "سنگ مرمر", swatch: "#e9e6e1" },
  travertine: { label: "تراورتن", swatch: "#d8c7aa" },
  microcement: { label: "میکروسمنت", swatch: "#a9a39b" },
};

export const lightModes: Record<LightMode, { label: string }> = {
  day: { label: "روز" },
  golden: { label: "عصر" },
  night: { label: "شب" },
};

export function presetConfig(type: RoomType): RoomConfig {
  const preset = roomTypes[type];
  return { type, ...preset.dimensions, wall: preset.wall, floor: preset.floor, light: "day" };
}

export function clampDimension(type: RoomType, key: keyof RoomDimensions, value: number): number {
  const { min, max } = dimensionLimits(type)[key];
  return Math.round(Math.min(max, Math.max(min, value)) * 10) / 10;
}
