// Mirrors globals.css so the hub can print hex values and contrast; palette.test.ts fails if the two drift.
export const palette = {
  background: { light: "#f3e9d6", dark: "#1a0f0d" },
  foreground: { light: "#2a1612", dark: "#f3e9d6" },
  card: { light: "#faf4e8", dark: "#26150f" },
  primary: { light: "#9e1b1f", dark: "#b3262a" },
  "primary-foreground": { light: "#faf4e8", dark: "#faf4e8" },
  "brand-deep": { light: "#6b0f14", dark: "#6b0f14" },
  "brand-text": { light: "#9e1b1f", dark: "#ec7a6c" },
  secondary: { light: "#e8dbc2", dark: "#33201a" },
  muted: { light: "#ebdfc9", dark: "#2e1c16" },
  "muted-foreground": { light: "#6b5246", dark: "#c2ab92" },
  indigo: { light: "#1f2f57", dark: "#9fb2e6" },
  "indigo-foreground": { light: "#faf4e8", dark: "#1a0f0d" },
  gold: { light: "#c08a2e", dark: "#e0b25a" },
  "gold-text": { light: "#8a5f1a", dark: "#e0b25a" },
  border: { light: "#d9c7a8", dark: "#3d2820" },
  destructive: { light: "#a3361f", dark: "#e0745c" },
  "destructive-foreground": { light: "#faf4e8", dark: "#1a0f0d" },
} as const;

export type PaletteToken = keyof typeof palette;

export const swatches: { token: PaletteToken; on: PaletteToken; name: string; role: string }[] = [
  { token: "primary", on: "primary-foreground", name: "روناس", role: "دکمه‌ی اصلی، تأکید" },
  { token: "brand-deep", on: "primary-foreground", name: "لاکی", role: "حالت فشرده، زمینه‌ی تیره" },
  { token: "background", on: "foreground", name: "کرم پشم", role: "زمینه‌ی صفحه" },
  { token: "card", on: "foreground", name: "شیری", role: "کارت و سطح بالاتر" },
  { token: "muted", on: "muted-foreground", name: "نخودی", role: "سطح آرام، متن کم‌رنگ" },
  { token: "indigo", on: "indigo-foreground", name: "لاجورد", role: "فوکوس و لینک فرعی" },
  { token: "gold", on: "foreground", name: "زعفرانی", role: "نشانه‌ی ریز، نه متن" },
  { token: "destructive", on: "destructive-foreground", name: "اخرایی", role: "خطا" },
];

/** Text-on-surface pairs that must pass WCAG AA (4.5:1) in both themes. */
export const textPairs: [text: PaletteToken, surface: PaletteToken][] = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["primary-foreground", "primary"],
  ["primary-foreground", "brand-deep"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["brand-text", "background"],
  ["gold-text", "background"],
  ["indigo-foreground", "indigo"],
  ["destructive-foreground", "destructive"],
];
