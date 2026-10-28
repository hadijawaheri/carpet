import { carpetCatalog } from "@farsh/contracts";
import { describe, expect, it } from "vitest";

import { moreCarpets } from "./more-carpets";

const bySlug = (slug: string) => carpetCatalog.find((c) => c.slug === slug)!;

describe("moreCarpets", () => {
  it("leaves the carpet itself out and puts its material first", () => {
    const slugs = moreCarpets(bySlug("medallion-black"), carpetCatalog).map((c) => c.slug);
    expect(slugs).not.toContain("medallion-black");
    expect(slugs[0]).toBe("navy-medallion");
    expect(slugs).toHaveLength(4);
  });

  it("keeps catalogue order within each group", () => {
    const slugs = moreCarpets(bySlug("three-medallion"), carpetCatalog).map((c) => c.slug);
    expect(slugs).toEqual(["medallion-black", "kashan-red", "navy-medallion", "mashhad-navy"]);
  });

  it("stops at the count", () => {
    expect(moreCarpets(bySlug("kashan-red"), carpetCatalog, 2)).toHaveLength(2);
  });
});
