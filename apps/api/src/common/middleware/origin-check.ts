import type { NextFunction, Request, Response } from "express";

import { AppException } from "../app-exception.js";
import { toErrorBody } from "../filters/all-exceptions.filter.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function originOf(req: Request): string | undefined {
  const origin = req.headers.origin;
  if (origin) return origin;
  const referer = req.headers.referer;
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return "invalid";
  }
}

/**
 * CSRF guard on top of SameSite=Lax: a write from a browser must come from one of our origins.
 * SameSite treats every subdomain as the same site, and CORS only hides the response; neither stops
 * the request itself. Requests without Origin or Referer are not from a browser page, so they carry
 * no ambient cookies worth forging.
 */
export function originCheck(allowed: readonly string[]) {
  const origins = new Set(allowed);
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = originOf(req);
    if (SAFE_METHODS.has(req.method) || origin === undefined || origins.has(origin)) {
      next();
      return;
    }
    const body = toErrorBody(
      new AppException(403, "FORBIDDEN", "درخواست از مبدأ نامعتبر رد شد"),
      req.id === undefined ? undefined : String(req.id),
    );
    res.status(403).json(body);
  };
}
