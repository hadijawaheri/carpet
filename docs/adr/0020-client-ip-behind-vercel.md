# 0020 · Visitor address behind Vercel

Date: 2026-11-10 · Status: accepted

- **Why:** the web app runs on Vercel and the API on its own server (docs/deploy/api-on-own-server.md). Every request reaches the API from a Vercel address, so the per-IP rate limits (OTP 3 a minute, inquiries 5 a minute) would count all visitors together, and one busy minute would lock everyone out of sign-in.
- **What:** `proxy.ts` now also runs on `/api/*` and, like `serverApi`, adds two headers for the API: `x-client-ip` (the first `X-Forwarded-For` entry, which Vercel and Caddy both overwrite with the connecting address) and `x-api-proxy-secret`. Copies of these headers sent by the visitor are dropped first. The API's `clientIp` middleware believes `x-client-ip` only when it is a valid IP and the secret matches `API_PROXY_SECRET` (compared in constant time); otherwise it keeps Express's own address. `ClientIpThrottlerGuard` keys the limits on that address, with the same IPv6 /64 grouping as before.
- **Why a secret and not `trust proxy`:** the API's hostname is public, and Vercel does not publish a fixed list of egress addresses, so trusting `X-Forwarded-For` from "the proxy" would let anyone pick their own address.
- **Without the secret** nothing changes: the API ignores the header and behaves as before, so the code can ship before the secret is set on both sides.
- **Logs:** pino redacts `x-api-proxy-secret` like the cookie and authorization headers.
- **Body size:** `/api/*` now passes through `proxy.ts`, whose request body is capped at 10 MB by Next when self-hosted (on Vercel the 4.5 MB limit comes first). The admin form already shrinks photos above 4 MB in the browser (ADR 0016), so uploads stay well under both.
