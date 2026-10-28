import { normalizeDigits } from "@farsh/contracts";

import { formatNumber } from "@/lib/format";

export type ParsedCount = { ok: true; value: number } | { ok: false; error: string };

/**
 * A whole number typed in Persian or Latin digits, within the range a real carpet can have.
 * Thousands separators are accepted, so pasting "۱٬۲۰۰" works; a space inside the number is not,
 * because "7 0" is more likely a typo than seventy.
 */
export function parseCount(input: string, min: number, max: number): ParsedCount {
  const text = normalizeDigits(input).trim().replace(/[,٬،]/g, "");
  if (text === "") return { ok: false, error: "یک عدد بنویسید" };
  if (!/^\d+$/.test(text)) return { ok: false, error: "فقط عدد صحیح بنویسید" };
  const value = Number(text);
  if (value < min || value > max) {
    return { ok: false, error: `عددی بین ${formatNumber(min)} و ${formatNumber(max)} بنویسید` };
  }
  return { ok: true, value };
}
