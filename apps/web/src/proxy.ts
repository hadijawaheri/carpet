import { type NextRequest, NextResponse } from "next/server";

import { buildCsp, createNonce } from "@/lib/csp";

export function proxy(request: NextRequest) {
  const csp = buildCsp(createNonce(), process.env.NODE_ENV === "development");

  // Next reads the nonce from the request's CSP header and stamps it on its own scripts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // /api is proxied JSON, and static files carry no script of their own
      source: "/((?!api|_next/static|_next/image|carpets|editorial|favicon.ico|icon.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
