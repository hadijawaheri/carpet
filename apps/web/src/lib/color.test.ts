import { describe, expect, it } from "vitest";

import { hexToHsl, hslToHex, luminance, mixHex, reshape } from "./color";

describe("color", () => {
  it("round-trips a colour through HSL", () => {
    for (const hex of ["#8a2a2e", "#d6a24a", "#1f2f57", "#f2e7d3", "#808080"]) {
      expect(hslToHex(hexToHsl(hex))).toBe(hex);
    }
  });

  it("mixes two colours halfway", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixHex("#112233", "#112233", 0.7)).toBe("#112233");
  });

  it("turns the hue by the given degrees and keeps the rest", () => {
    const turned = hexToHsl(reshape("#ff0000", { h: 120 }));
    expect(turned.h).toBeCloseTo(120, 0);
    expect(turned.s).toBeCloseTo(1, 2);
  });

  it("ranks luminance from black to white", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
    expect(luminance("#8a2a2e")).toBeLessThan(luminance("#f2e7d3"));
  });
});
