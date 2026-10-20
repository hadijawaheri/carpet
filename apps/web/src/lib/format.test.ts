import { describe, expect, it } from "vitest";

import { formatPriceRial, formatSizeCm } from "./format";

describe("format", () => {
  it("shows tomans from a rial price and asks for a quote when there is none", () => {
    expect(formatPriceRial(1_250_000_000)).toBe("۱۲۵٬۰۰۰٬۰۰۰ تومان");
    expect(formatPriceRial(undefined)).toBe("استعلام قیمت");
  });

  it("writes a size in Persian digits", () => {
    expect(formatSizeCm(150, 225)).toBe("۱۵۰ × ۲۲۵ سانتی‌متر");
  });
});
