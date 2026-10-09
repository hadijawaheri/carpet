import { describe, expect, it } from "vitest";

import { knotsPerSquareMetre } from "./density";

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
