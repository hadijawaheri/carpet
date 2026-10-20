import { describe, expect, it } from "vitest";

import { listCarpetsQuerySchema, updateCarpetSchema } from "./carpet-admin.schema";

describe("listCarpetsQuerySchema", () => {
  it("coerces paging and accepts a material filter", () => {
    expect(listCarpetsQuerySchema.parse({ page: "2", material: "silk" })).toEqual({
      page: 2,
      limit: 20,
      material: "silk",
    });
    expect(listCarpetsQuerySchema.safeParse({ material: "cotton" }).success).toBe(false);
  });
});

describe("updateCarpetSchema", () => {
  it("does not reset isPlaceholder when it is not sent", () => {
    expect(updateCarpetSchema.parse({ name: "کاشان" })).toEqual({ name: "کاشان" });
  });

  it("rejects an empty update and drops the slug", () => {
    expect(updateCarpetSchema.safeParse({}).success).toBe(false);
    expect(updateCarpetSchema.parse({ slug: "x", widthCm: 100 })).toEqual({ widthCm: 100 });
  });
});
