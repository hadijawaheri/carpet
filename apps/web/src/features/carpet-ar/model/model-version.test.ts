import { describe, expect, it } from "vitest";

import { modelVersion } from "./model-version";

const carpet = { image: "/carpets/a.webp", widthCm: 200, lengthCm: 300 };

describe("modelVersion", () => {
  it("is stable for the same photo and size", () => {
    expect(modelVersion(carpet)).toBe(modelVersion({ ...carpet }));
    expect(modelVersion(carpet)).toMatch(/^[0-9a-f]{8}$/);
  });

  it("changes when the photo or the size does", () => {
    const base = modelVersion(carpet);
    expect(modelVersion({ ...carpet, image: "/carpets/b.webp" })).not.toBe(base);
    expect(modelVersion({ ...carpet, widthCm: 201 })).not.toBe(base);
    expect(modelVersion({ ...carpet, lengthCm: 301 })).not.toBe(base);
  });
});
