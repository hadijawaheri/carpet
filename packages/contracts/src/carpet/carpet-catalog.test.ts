import { describe, expect, it } from "vitest";

import { carpetCatalog } from "./carpet-catalog";

describe("carpetCatalog", () => {
  it("has unique slugs and only the owner's photos", () => {
    const slugs = carpetCatalog.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const carpet of carpetCatalog) expect(carpet.image).toMatch(/^\/carpets\/[a-z-]+\.jpg$/);
  });
});
