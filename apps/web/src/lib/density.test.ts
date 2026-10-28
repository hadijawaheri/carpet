import { describe, expect, it } from "vitest";

import { knotsPerSquareInch, knotsPerSquareMetre, rajKnotSpacingMm, totalKnots } from "./density";

describe("knotsPerSquareMetre", () => {
  it("multiplies shaneh by takham for machine-made carpets", () => {
    expect(knotsPerSquareMetre({ unit: "shaneh", value: 1200, takham: 3600 })).toBe(4_320_000);
  });

  it("returns null when takham is missing", () => {
    expect(knotsPerSquareMetre({ unit: "shaneh", value: 1000 })).toBeNull();
  });

  it("squares the per-metre raj count for hand-knotted carpets", () => {
    expect(knotsPerSquareMetre({ unit: "raj", value: 70 })).toBe(1_000_000);
  });
});

describe("knotsPerSquareInch", () => {
  it("converts a metric count to the foreign trade's unit", () => {
    // 70 raj, about a million knots per m², is the 645 KPSI of a fine Persian rug
    expect(knotsPerSquareInch(1_000_000)).toBe(645);
    expect(knotsPerSquareInch(0)).toBe(0);
  });
});

describe("totalKnots", () => {
  it("scales the per-m² count by the carpet's area", () => {
    expect(totalKnots(1_000_000, 200, 300)).toBe(6_000_000);
    expect(totalKnots(4_320_000, 150, 225)).toBe(14_580_000);
  });
});

describe("rajKnotSpacingMm", () => {
  it("spreads seven centimetres over the raj count", () => {
    expect(rajKnotSpacingMm(70)).toBe(1);
    expect(rajKnotSpacingMm(35)).toBe(2);
  });
});
