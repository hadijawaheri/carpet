import { createInquirySchema } from "@farsh/contracts";
import { describe, expect, it } from "vitest";

import { fieldErrors } from "./field-errors";

describe("fieldErrors", () => {
  it("keeps the first Persian message for each field", () => {
    const result = createInquirySchema.safeParse({ name: "a", mobile: "123", carpetSlugs: [] });
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = fieldErrors(result.error);
    expect(errors.mobile).toBe("شماره موبایل معتبر نیست");
    expect(errors.carpetSlugs).toBe("دست‌کم یک فرش انتخاب کنید");
    expect(errors.name).toBe("نام را کامل بنویسید");
  });
});
