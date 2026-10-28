import { type Carpet, carpetCatalog } from "@farsh/contracts";
import { describe, expect, it } from "vitest";

import { certificateRows, isCertified } from "./certificate-rows";

const kashan = carpetCatalog.find((c) => c.slug === "kashan-red")!;
const row = (carpet: Carpet, term: string) =>
  certificateRows(carpet).find(([t]) => t === term)?.[1];

describe("certificateRows", () => {
  it("says 'not recorded' for every provenance fact the catalogue lacks", () => {
    for (const term of ["محل بافت", "کارگاه", "بافنده", "سال بافت"]) {
      expect(row(kashan, term)).toBe("ثبت نشده");
    }
  });

  it("shows recorded provenance, with the year ungrouped", () => {
    const carpet = { ...kashan, provenance: { origin: "کاشان", wovenYear: 1398 } };
    expect(row(carpet, "محل بافت")).toBe("کاشان");
    expect(row(carpet, "سال بافت")).toBe("۱۳۹۸");
    expect(row(carpet, "بافنده")).toBe("ثبت نشده");
  });

  it("states the measured facts", () => {
    expect(row(kashan, "ابعاد")).toBe("۲۰۰ × ۳۴۵ سانتی‌متر");
    expect(row(kashan, "تراکم")).toBe("۵۰ رج");
    expect(row(kashan, "گره در متر مربع")).toMatch(/^حدود /);
  });
});

describe("isCertified", () => {
  it("needs final facts and a known origin", () => {
    expect(isCertified(kashan)).toBe(false);
    expect(isCertified({ ...kashan, isPlaceholder: false })).toBe(false);
    expect(isCertified({ ...kashan, provenance: { origin: "کاشان" } })).toBe(false);
    expect(isCertified({ ...kashan, isPlaceholder: false, provenance: { origin: "کاشان" } })).toBe(
      true,
    );
  });
});
