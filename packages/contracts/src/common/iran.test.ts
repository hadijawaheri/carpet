import { describe, expect, it } from "vitest";

import { maskMobile, mobileSchema } from "./iran";

describe("mobileSchema", () => {
  it("accepts Persian digits and normalises them", () => {
    expect(mobileSchema.parse(" ۰۹۱۲۳۴۵۶۷۸۹ ")).toBe("09123456789");
  });

  it.each(["9123456789", "0912345678", "+989123456789", "08123456789"])("rejects %s", (input) => {
    expect(mobileSchema.safeParse(input).success).toBe(false);
  });

  it("masks the middle digits", () => {
    expect(maskMobile("09123456789")).toBe("0912***6789");
  });
});
