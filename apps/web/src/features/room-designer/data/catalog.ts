import type { PaintingItem, RoomItemKind, TableItem, WallSide } from "@farsh/contracts";

export const itemLabels: Record<RoomItemKind, string> = {
  sofa: "مبل",
  table: "میز",
  painting: "تابلو",
  curtain: "پرده",
};

export const wallLabels: Record<WallSide, string> = {
  back: "دیوار روبه‌رو",
  left: "دیوار چپ",
  right: "دیوار راست",
  front: "دیوار پشت به شما",
};

/** Sizes in metres. Furniture is built from simple shapes at real scale, so a rug can be judged against it. */
export const SOFA = {
  seatWidth: 0.62,
  arm: 0.16,
  depth: 0.92,
  legHeight: 0.1,
  seatTop: 0.44,
  backTop: 0.88,
};

const tableSizes = {
  round: {
    coffee: { s: 0.5, m: 0.8, l: 1.1 },
    dining: { s: 0.9, m: 1.2, l: 1.5 },
  },
  rect: {
    coffee: { s: [0.7, 0.5], m: [1, 0.6], l: [1.3, 0.7] },
    dining: { s: [1.2, 0.8], m: [1.6, 0.9], l: [2, 1] },
  },
} as const;

const tableHeights = { coffee: 0.42, dining: 0.75 } as const;

export function tableDimensions(table: Pick<TableItem, "shape" | "size" | "height">) {
  const top = tableHeights[table.height];
  if (table.shape === "round") {
    const diameter = tableSizes.round[table.height][table.size];
    return { width: diameter, depth: diameter, height: top };
  }
  const [width, depth] = tableSizes.rect[table.height][table.size];
  return { width, depth, height: top };
}

const paintingSizes = { s: [0.4, 0.5], m: [0.6, 0.8], l: [0.8, 1.1] } as const;

export function paintingDimensions(painting: Pick<PaintingItem, "size" | "orientation">) {
  const [short, long] = paintingSizes[painting.size];
  return painting.orientation === "portrait"
    ? { width: short, height: long }
    : { width: long, height: short };
}

/** Window the curtains frame: a fixed height and sill, so only its width is the visitor's choice. */
export const WINDOW = { sill: 0.9, height: 1.35, rodDrop: 0.12, rodOverhang: 0.45 };

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

export const accentSwatches: SwatchOption[] = [
  { hex: "#8a2a2e", label: "قرمز فرشی" },
  { hex: "#c98f4a", label: "زعفرانی" },
  { hex: "#2f3f63", label: "سرمه‌ای" },
  { hex: "#4a7a74", label: "فیروزه‌ای تیره" },
  { hex: "#d9c7a8", label: "کرم" },
  { hex: "#2a2a2c", label: "ذغالی" },
];
