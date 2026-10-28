import { describe, expect, it } from "vitest";

import { parseCount } from "./parse-count";

describe("parseCount", () => {
  it("reads Persian, Arabic-Indic and Latin digits with separators", () => {
    expect(parseCount("۷۰", 10, 150)).toEqual({ ok: true, value: 70 });
    expect(parseCount("٧٠", 10, 150)).toEqual({ ok: true, value: 70 });
    expect(parseCount(" ۱٬۲۰۰ ", 100, 2000)).toEqual({ ok: true, value: 1200 });
    expect(parseCount("۱،۲۰۰", 100, 2000)).toEqual({ ok: true, value: 1200 });
    expect(parseCount("1,200", 100, 2000)).toEqual({ ok: true, value: 1200 });
  });

  it("rejects a space inside the number", () => {
    expect(parseCount("7 0", 1, 200).ok).toBe(false);
  });

  it("asks for a number when empty", () => {
    expect(parseCount("  ", 10, 150)).toEqual({ ok: false, error: "یک عدد بنویسید" });
  });

  it("rejects fractions, signs and letters", () => {
    for (const input of ["۷۰.۵", "-70", "70رج", "abc"]) {
      expect(parseCount(input, 10, 150)).toEqual({ ok: false, error: "فقط عدد صحیح بنویسید" });
    }
  });

  it("gives the allowed range in Persian digits", () => {
    expect(parseCount("9", 10, 150)).toEqual({ ok: false, error: "عددی بین ۱۰ و ۱۵۰ بنویسید" });
    expect(parseCount("151", 10, 150).ok).toBe(false);
  });
});
