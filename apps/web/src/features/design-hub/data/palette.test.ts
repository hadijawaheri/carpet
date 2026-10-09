import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/lib/contrast";

import { palette, type PaletteToken, textPairs } from "./palette";

const css = readFileSync(new URL("../../../app/globals.css", import.meta.url), "utf8");
const rootBlock = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
const cssTokens = Object.fromEntries(
  [...rootBlock.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [m[1], m[2]]),
);

describe("palette", () => {
  it.each(Object.entries(palette))("%s matches globals.css", (token, value) => {
    expect(cssTokens[token]).toBe(value);
  });

  it.each(textPairs)("%s on %s passes AA", (text: PaletteToken, surface: PaletteToken) => {
    expect(contrastRatio(palette[text], palette[surface])).toBeGreaterThanOrEqual(4.5);
  });
});
