import { describe, expect, it } from "vitest";

import { normalizeDigits } from "./digits";

describe("normalizeDigits", () => {
  it.each([
    ["۱۲۰۰", "1200"],
    ["٣٦٠٠", "3600"],
    ["۶۰ رج", "60 رج"],
    ["abc", "abc"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeDigits(input)).toBe(expected);
  });
});
