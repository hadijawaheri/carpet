import type {
  FloorStyle,
  PaintingItem,
  RoomItemKind,
  RoomLight,
  TableItem,
  WallSide,
} from "@farsh/contracts";

export const itemLabels: Record<RoomItemKind, string> = {
  sofa: "مبل",
  table: "میز",
  lamp: "آباژور",
  plant: "گلدان",
  cabinet: "کنسول",
  pouf: "پاف",
  painting: "تابلو",
  curtain: "پرده",
};

export const wallLabels: Record<WallSide, string> = {
  back: "دیوار روبه‌رو",
  left: "دیوار چپ",
  right: "دیوار راست",
  front: "دیوار پشت به شما",
};

export const lightLabels: Record<RoomLight, string> = {
  morning: "صبح",
  noon: "ظهر",
  evening: "غروب",
  night: "شب",
};

export const floorStyleLabels: Record<FloorStyle, string> = {
  planks: "پارکت ساده",
  herringbone: "جناغی",
  tiles: "سنگ",
  concrete: "بتن صیقلی",
};

/** Sizes in metres. Furniture is modelled at real scale, so a rug can be judged against it. */
export const SOFA = {
  seatWidth: 0.62,
  arm: 0.16,
  depth: 0.92,
  legHeight: 0.12,
  seatTop: 0.45,
  backTop: 0.86,
  /** A chaise runs this far forward from the sofa's back. */
  chaiseLength: 1.6,
};

const tableSizes = {
  round: {
    coffee: { s: 0.6, m: 0.85, l: 1.1 },
    side: { s: 0.4, m: 0.5, l: 0.6 },
    dining: { s: 0.9, m: 1.2, l: 1.5 },
  },
  rect: {
    coffee: { s: [0.8, 0.5], m: [1.1, 0.6], l: [1.4, 0.7] },
    side: { s: [0.45, 0.45], m: [0.55, 0.45], l: [0.65, 0.5] },
    dining: { s: [1.2, 0.8], m: [1.6, 0.9], l: [2.2, 1] },
  },
} as const;

const tableHeights = { coffee: 0.42, side: 0.55, dining: 0.75 } as const;

export function tableDimensions(table: Pick<TableItem, "shape" | "size" | "height">) {
  const top = tableHeights[table.height];
  if (table.shape === "round") {
    const diameter = tableSizes.round[table.height][table.size];
    return { width: diameter, depth: diameter, height: top };
  }
  const [width, depth] = tableSizes.rect[table.height][table.size];
  return { width, depth, height: top };
}

/** A dining chair, and how far it stands out from the table's edge. */
export const CHAIR = { width: 0.46, depth: 0.5, seat: 0.46, back: 0.9, reach: 0.38 };

export const LAMP = { base: 0.34, height: 1.62, shade: 0.42 };

export const plantSizes = {
  s: { pot: 0.26, height: 0.55 },
  m: { pot: 0.34, height: 0.95 },
  l: { pot: 0.44, height: 1.55 },
} as const;

export const cabinetShapes = {
  console: { depth: 0.36, height: 0.8 },
  tv: { depth: 0.42, height: 0.5 },
  bookcase: { depth: 0.32, height: 1.9 },
} as const;

export const POUF = { size: 0.52, height: 0.42 };

const paintingSizes = { s: [0.4, 0.5], m: [0.6, 0.8], l: [0.8, 1.1] } as const;
/** Long side of a carpet tableau, by size: woven pictures are larger than prints. */
const tableauLong = { s: 0.6, m: 0.9, l: 1.25 } as const;

export const frameDepth: Record<PaintingItem["frame"], number> = {
  none: 0,
  thin: 0.025,
  wood: 0.05,
  gold: 0.085,
};

/**
 * Outer size of a painting in metres, frame included. A carpet tableau keeps its photo's proportions
 * inside the frame, so the woven picture is never stretched.
 */
export function paintingDimensions(
  painting: Pick<PaintingItem, "size" | "orientation" | "art" | "frame">,
  photoAspect?: number,
) {
  if (painting.art === "carpet" && photoAspect) {
    const long = tableauLong[painting.size];
    const bar = 2 * frameDepth[painting.frame];
    return photoAspect < 1
      ? { width: long * photoAspect + bar, height: long + bar }
      : { width: long + bar, height: long / photoAspect + bar };
  }
  const [short, long] = paintingSizes[painting.size];
  return painting.orientation === "portrait"
    ? { width: short, height: long }
    : { width: long, height: short };
}

/** Window the curtains frame: a fixed height and sill, so only its width is the visitor's choice. */
export const WINDOW = { sill: 0.9, height: 1.35, rodDrop: 0.12, rodOverhang: 0.45 };

/**
 * Rug sizes as an Iranian buyer names them (by floor area). Only the length is set: the width follows
 * the photo, so the result is "about" that size, and the panel shows the real figures.
 */
export const rugSizes = [
  { label: "پادری", lengthCm: 90 },
  { label: "ذرع‌ونیم", lengthCm: 150 },
  { label: "۳ متری", lengthCm: 225 },
  { label: "۶ متری", lengthCm: 300 },
  { label: "۹ متری", lengthCm: 350 },
  { label: "۱۲ متری", lengthCm: 400 },
] as const;

export interface SwatchOption {
  hex: string;
  label: string;
}

/** Starting colours for each material, in the visitor's language. Any colour can still be typed in. */
export const wallSwatches: SwatchOption[] = [
  { hex: "#f1ece3", label: "گچی" },
  { hex: "#efe6d6", label: "کرم" },
  { hex: "#e3d3b8", label: "شنی" },
  { hex: "#d9c3b0", label: "هلویی" },
  { hex: "#b9c5b5", label: "سبز مغزپسته‌ای" },
  { hex: "#a9bdc9", label: "آبی یخی" },
  { hex: "#6f8aa0", label: "آبی خاکستری" },
  { hex: "#2f3f63", label: "سرمه‌ای" },
  { hex: "#7a2a30", label: "لاکی" },
  { hex: "#3d3d40", label: "ذغالی" },
];

export const floorSwatches: SwatchOption[] = [
  { hex: "#d9bf94", label: "بلوط روشن" },
  { hex: "#a98562", label: "گردو" },
  { hex: "#7a5538", label: "گردوی تیره" },
  { hex: "#4a3427", label: "آبنوس" },
  { hex: "#bdb6aa", label: "سنگ روشن" },
  { hex: "#6f6a63", label: "بتنی" },
];

export const fabricSwatches: SwatchOption[] = [
  { hex: "#8f877d", label: "طوسی گرم" },
  { hex: "#c9b79c", label: "بژ" },
  { hex: "#e8e1d4", label: "شیری" },
  { hex: "#3f5a7a", label: "نیلی" },
  { hex: "#5d7a5f", label: "سبز زیتونی" },
  { hex: "#9a3b36", label: "آجری" },
  { hex: "#c98f4a", label: "خردلی" },
  { hex: "#2f2a2a", label: "مشکی" },
];

export const woodSwatches: SwatchOption[] = [
  { hex: "#3b2a20", label: "آبنوس" },
  { hex: "#6b4a30", label: "گردو" },
  { hex: "#b78a5b", label: "بلوط" },
  { hex: "#e6d5b8", label: "راش" },
  { hex: "#f2efe8", label: "سفید" },
  { hex: "#1f1f22", label: "سیاه" },
];

export const frameSwatches: SwatchOption[] = [
  { hex: "#2a1b14", label: "قهوه‌ای سوخته" },
  { hex: "#1f1f22", label: "مشکی" },
  { hex: "#f2efe8", label: "سفید" },
  { hex: "#6b4a30", label: "گردو" },
  { hex: "#b78a5b", label: "بلوط" },
  { hex: "#b8913f", label: "طلایی" },
  { hex: "#c7c9cc", label: "نقره‌ای" },
];

/** The colour each frame style usually comes in; picked when the style changes, then free to change. */
export const frameDefaults = {
  thin: "#2a1b14",
  wood: "#6b4a30",
  gold: "#b8913f",
  none: "#2a1b14",
} as const;

export const metalSwatches: SwatchOption[] = [
  { hex: "#b89a5e", label: "برنجی" },
  { hex: "#1f1f22", label: "مشکی" },
  { hex: "#c7c9cc", label: "استیل" },
  { hex: "#8a5a3b", label: "مسی" },
];

export const potSwatches: SwatchOption[] = [
  { hex: "#c9b79c", label: "سفالی روشن" },
  { hex: "#a65f3d", label: "سفال" },
  { hex: "#f2efe8", label: "سفید" },
  { hex: "#2f2a2a", label: "مشکی" },
  { hex: "#4a7a74", label: "فیروزه‌ای" },
];

export const accentSwatches: SwatchOption[] = [
  { hex: "#8a2a2e", label: "قرمز فرشی" },
  { hex: "#c98f4a", label: "زعفرانی" },
  { hex: "#2f3f63", label: "سرمه‌ای" },
  { hex: "#4a7a74", label: "فیروزه‌ای تیره" },
  { hex: "#d9c7a8", label: "کرم" },
  { hex: "#2a2a2c", label: "ذغالی" },
];
