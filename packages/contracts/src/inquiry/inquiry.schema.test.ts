import { describe, expect, it } from "vitest";

import { createInquirySchema } from "./inquiry.schema";

describe("createInquirySchema", () => {
  const base = { name: "هادی", mobile: "۰۹۱۲۳۴۵۶۷۸۹", carpetSlugs: ["kashan-red"] };

  it("normalises the mobile and drops unknown fields", () => {
    const parsed = createInquirySchema.parse({ ...base, status: "closed" });
    expect(parsed.mobile).toBe("09123456789");
    expect(parsed).not.toHaveProperty("status");
  });

  it("rejects an empty or duplicated selection", () => {
    expect(createInquirySchema.safeParse({ ...base, carpetSlugs: [] }).success).toBe(false);
    expect(
      createInquirySchema.safeParse({ ...base, carpetSlugs: ["kashan-red", "kashan-red"] }).success,
    ).toBe(false);
  });
});
