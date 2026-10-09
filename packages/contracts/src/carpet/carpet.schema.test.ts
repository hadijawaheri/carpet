import { describe, expect, it } from "vitest";

import { carpetSchema, knotDensitySchema } from "./carpet.schema";

describe("carpetSchema", () => {
  const base = {
    slug: "medallion-black",
    name: "ترنج تیره",
    material: "machine",
    widthCm: 150,
    lengthCm: 225,
    image: "/carpets/medallion-black.jpg",
    imageAspect: 0.656,
  };

  it("accepts a carpet and defaults isPlaceholder to false", () => {
    expect(carpetSchema.parse(base).isPlaceholder).toBe(false);
  });

  it("rejects a slug with Persian or upper-case letters", () => {
    expect(carpetSchema.safeParse({ ...base, slug: "Farsh-ترنج" }).success).toBe(false);
  });

  it("accepts raj and shaneh densities and rejects an unknown unit", () => {
    expect(knotDensitySchema.parse({ unit: "shaneh", value: 1200, takham: 3600 }).unit).toBe(
      "shaneh",
    );
    expect(knotDensitySchema.parse({ unit: "raj", value: 60 }).value).toBe(60);
    expect(knotDensitySchema.safeParse({ unit: "kpsi", value: 300 }).success).toBe(false);
  });
});
