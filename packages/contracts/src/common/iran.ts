import { z } from "zod";

import { normalizeDigits } from "./digits";

export const digitsString = z.string().trim().transform(normalizeDigits);

export const mobileSchema = digitsString.pipe(
  z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
);

/** Masks the middle digits so logs and admin lists never carry a full number. */
export function maskMobile(mobile: string): string {
  return mobile.length === 11 ? `${mobile.slice(0, 4)}***${mobile.slice(7)}` : "***";
}
