// Run with `node e2e/mock-api.ts` (Node strips the types). Stand-in for the Nest API on the server side of the e2e build: Server Components (lib/auth/dal.ts)
// and proxy.ts call INTERNAL_API_URL directly, where page.route cannot reach. Browser calls through
// /api are still mocked per test with page.route.
import { createServer, type OutgoingHttpHeaders } from "node:http";

export const E2E_USER = {
  id: "6650f0c2a1b2c3d4e5f60718",
  mobile: "09123456789",
  firstName: "هادی",
  lastName: null,
  role: "user",
  createdAt: "2026-10-01T00:00:00.000Z",
};
const unauthenticated = {
  statusCode: 401,
  code: "UNAUTHENTICATED",
  message: "لطفاً وارد حساب خود شوید",
};

const port = Number(process.env.MOCK_API_PORT ?? 7799);

const server = createServer((req, res) => {
  const cookie = req.headers.cookie ?? "";
  const json = (status: number, body: unknown, headers: OutgoingHttpHeaders = {}) => {
    res.writeHead(status, { "content-type": "application/json", ...headers });
    res.end(JSON.stringify(body));
  };

  if (req.method === "GET" && req.url === "/v1/auth/me") {
    return cookie.includes("access_token=e2e-valid")
      ? json(200, { data: { user: E2E_USER } })
      : json(401, unauthenticated);
  }
  if (req.method === "POST" && req.url === "/v1/auth/refresh") {
    if (!cookie.includes("refresh_token=e2e-refresh")) return json(401, unauthenticated);
    res.writeHead(204, {
      "set-cookie": [
        "access_token=e2e-valid; Path=/; HttpOnly; SameSite=Lax; Max-Age=900",
        "refresh_token=e2e-refresh-2; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000",
      ],
    });
    return res.end();
  }
  // Anything else (the carpets list) is "down", so the showroom uses its bundled catalogue
  return json(503, { statusCode: 503, code: "INTERNAL", message: "سرویس در دسترس نیست" });
});

// The spec imports E2E_USER from here; only `node e2e/mock-api.ts` starts the server
if (import.meta.url === `file://${process.argv[1]}`) server.listen(port, "127.0.0.1");
