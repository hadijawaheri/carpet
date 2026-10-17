import { carpetCatalog } from "@farsh/contracts";
import { describe, expect, it } from "vitest";

import { matchesSearch } from "./showroom-store";

const carpet = carpetCatalog.find((c) => c.slug === "navy-medallion")!;

describe("matchesSearch", () => {
  it("matches an empty query", () => {
    expect(matchesSearch(carpet, "ابریشم", "  ")).toBe(true);
  });

  it("matches Arabic yeh and kaf typed on a non-Persian keyboard", () => {
    expect(matchesSearch(carpet, "ابریشم", "سرمه‌اي")).toBe(true);
  });

  it("matches the material label and rejects unrelated text", () => {
    expect(matchesSearch(carpet, "ابریشم", "ابریشم")).toBe(true);
    expect(matchesSearch(carpet, "ابریشم", "کاشان")).toBe(false);
  });
});
