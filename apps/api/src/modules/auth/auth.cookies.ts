import { COOKIE_NAMES } from "@farsh/contracts";
import type { CookieOptions, Response } from "express";

export const ACCESS_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** `secure` is off only in local development, which runs on plain http. */
function baseOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, sameSite: "lax", secure, path: "/" };
}

export function setSessionCookies(res: Response, tokens: SessionTokens, secure: boolean): void {
  res.cookie(COOKIE_NAMES.access, tokens.accessToken, {
    ...baseOptions(secure),
    maxAge: ACCESS_TTL_MS,
  });
  res.cookie(COOKIE_NAMES.refresh, tokens.refreshToken, {
    ...baseOptions(secure),
    maxAge: REFRESH_TTL_MS,
  });
}

export function clearSessionCookies(res: Response, secure: boolean): void {
  res.clearCookie(COOKIE_NAMES.access, baseOptions(secure));
  res.clearCookie(COOKIE_NAMES.refresh, baseOptions(secure));
}
