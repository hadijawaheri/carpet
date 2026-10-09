// Mirrors globals.css so the guide can print hex values and contrast; palette.test.ts fails if the two drift.
export const palette = {
  background: "#6c1116",
  foreground: "#f4e8d5",
  "wall-deep": "#470a0e",
  "wall-lit": "#8c1b20",
  "on-wall-muted": "#e2c2a4",
  saffron: "#d6a24a",
  card: "#f2e7d3",
  "card-foreground": "#2a1410",
  muted: "#e9dcc4",
  "muted-foreground": "#6a4637",
  secondary: "#e6d6bb",
  border: "#d2bd9b",
  primary: "#7d141a",
  "primary-foreground": "#f4e8d5",
  destructive: "#8f2a14",
  "destructive-foreground": "#f4e8d5",
  indigo: "#1f2f57",
  "indigo-foreground": "#f4e8d5",
} as const;

export type PaletteToken = keyof typeof palette;

export const swatches: { token: PaletteToken; on: PaletteToken; name: string; role: string }[] = [
  { token: "background", on: "foreground", name: "دیوار روناس", role: "زمینه‌ی تالارها" },
  { token: "wall-deep", on: "foreground", name: "سایه‌ی دیوار", role: "مجموعه و پای دیوار" },
  { token: "wall-lit", on: "foreground", name: "نور نقطه‌ای", role: "حوضچه‌ی نور پشت فرش" },
  { token: "card", on: "card-foreground", name: "مقوای پایه", role: "برچسب‌ها و اتاق مطالعه" },
  { token: "primary", on: "primary-foreground", name: "روناس تیره", role: "کنش روی مقوا" },
  { token: "saffron", on: "wall-deep", name: "زعفرانی", role: "میله‌ی آویز و فوکوس روی دیوار" },
  { token: "indigo", on: "indigo-foreground", name: "لاجورد", role: "ذره‌بین و فوکوس روی مقوا" },
  { token: "muted", on: "muted-foreground", name: "نخودی", role: "سطح آرام روی مقوا" },
];

/** Text-on-surface pairs that must pass WCAG AA (4.5:1). */
export const textPairs: [text: PaletteToken, surface: PaletteToken][] = [
  ["foreground", "background"],
  ["foreground", "wall-deep"],
  ["foreground", "wall-lit"],
  ["on-wall-muted", "background"],
  ["on-wall-muted", "wall-deep"],
  ["on-wall-muted", "wall-lit"],
  ["saffron", "background"],
  ["saffron", "wall-deep"],
  ["card-foreground", "card"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["primary", "card"],
  ["primary-foreground", "primary"],
  ["destructive-foreground", "destructive"],
  ["indigo-foreground", "indigo"],
];
