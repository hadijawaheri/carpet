import { describe, expect, it } from "vitest";

import { hexToHsl } from "./color";
import { dominantColors, mainColor, suggestPalettes } from "./image-palette";

/** Smallest angle between two hues, 0–180. */
const hueGap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

/** RGBA pixels: `red` parts madder, `cream` parts cream, `ink` parts near-black. */
function pixels(red: number, cream: number, ink: number) {
  const out: number[] = [];
  const push = (n: number, r: number, g: number, b: number) => {
    for (let i = 0; i < n; i++) out.push(r, g, b, 255);
  };
  push(red, 160, 32, 42);
  push(cream, 240, 230, 210);
  push(ink, 30, 20, 20);
  return out;
}

describe("dominantColors", () => {
  it("returns the colours in order of how much of the picture they cover", () => {
    const swatches = dominantColors(pixels(700, 200, 100), 3);
    expect(swatches).toHaveLength(3);
    expect(swatches[0]?.share).toBeCloseTo(0.7, 2);
    expect(hueGap(hexToHsl(swatches[0]!.hex).h, 358)).toBeLessThan(10);
    expect(swatches[1]?.share).toBeCloseTo(0.2, 2);
  });

  it("merges near-identical shades instead of listing them twice", () => {
    const out: number[] = [];
    for (let i = 0; i < 200; i++) out.push(160 + (i % 5), 32, 42, 255);
    expect(dominantColors(out, 4)).toHaveLength(1);
  });

  it("ignores transparent pixels and copes with an empty picture", () => {
    expect(dominantColors([160, 32, 42, 0, 160, 32, 42, 0], 3)).toEqual([]);
    expect(dominantColors([], 3)).toEqual([]);
  });
});

describe("suggestPalettes", () => {
  const swatches = dominantColors(pixels(700, 200, 100), 4);

  it("picks the coloured swatch over cream or black as the carpet's main colour", () => {
    expect(hueGap(hexToHsl(mainColor(swatches)).h, 358)).toBeLessThan(10);
  });

  it("offers four distinct schemes, all valid colours", () => {
    const palettes = suggestPalettes(swatches);
    expect(palettes.map((p) => p.id)).toEqual(["tonal", "complement", "calm", "deep"]);
    for (const palette of palettes) {
      for (const value of Object.values(palette)) {
        if (typeof value === "string" && value.startsWith("#")) {
          expect(value).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it("sets the complementary sofa about opposite the carpet on the colour wheel", () => {
    const complement = suggestPalettes(swatches).find((p) => p.id === "complement");
    const carpetHue = hexToHsl(mainColor(swatches)).h;
    const sofaHue = hexToHsl(complement!.sofa).h;
    expect(Math.abs(hueGap(sofaHue, carpetHue) - 180)).toBeLessThan(12);
  });

  it("still returns schemes when the picture gave no colours", () => {
    expect(suggestPalettes([])).toHaveLength(4);
  });
});
