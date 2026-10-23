import { COOKIE_NAMES } from "@farsh/contracts";
import { type NextRequest, NextResponse } from "next/server";

import { buildCsp, createNonce } from "@/lib/csp";
import { paths } from "@/lib/paths";

const API_ORIGIN = process.env.INTERNAL_API_URL ?? "http://localhost:7781";
const PROTECTED_PREFIXES = [paths.dashboard];

function redirectToSignIn(request: NextRequest): NextResponse {
  const url = new URL(paths.signIn, request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  const response = NextResponse.redirect(url);
  response.cookies.delete(COOKIE_NAMES.access);
  response.cookies.delete(COOKIE_NAMES.refresh);
  return response;
}

/** Fresh session cookies from the API, or null when the refresh token is gone or rejected. */
async function refresh(request: NextRequest): Promise<string[] | null> {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const res = await fetch(`${API_ORIGIN}/v1/auth/refresh`, {
    method: "POST",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
    },
    cache: "no-store",
  }).catch(() => null);
  return res?.ok ? res.headers.getSetCookie() : null;
}

/** The request's Cookie header with the rotated values, so this same render sees the new session. */
function withCookies(request: NextRequest, setCookies: string[]): string {
  const jar = new Map(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value]));
  for (const line of setCookies) {
    const pair = line.split(";")[0] ?? "";
    const index = pair.indexOf("=");
    jar.set(pair.slice(0, index).trim(), pair.slice(index + 1));
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

// Optimistic check only: the real authorization is the API guards and lib/auth/dal.ts. Server
// Components cannot set cookies, so an expired access cookie is rotated here.
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const requestHeaders = new Headers(request.headers);
  let setCookies: string[] = [];

  const { pathname } = request.nextUrl;
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!request.cookies.has(COOKIE_NAMES.access)) {
      if (!request.cookies.has(COOKIE_NAMES.refresh)) return redirectToSignIn(request);
      const fresh = await refresh(request);
      if (!fresh) return redirectToSignIn(request);
      setCookies = fresh;
      requestHeaders.set("cookie", withCookies(request, fresh));
    }
  }

  // Next reads the nonce from the request's CSP header and stamps it on its own scripts
  const csp = buildCsp(createNonce(), process.env.NODE_ENV === "development");
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  for (const line of setCookies) response.headers.append("set-cookie", line);
  return response;
}

export const config = {
  matcher: [
    {
      // /api is proxied JSON, /monitoring is the Sentry tunnel, and static files carry no script
      source:
        "/((?!api|monitoring|_next/static|_next/image|carpets|editorial|favicon.ico|icon.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
