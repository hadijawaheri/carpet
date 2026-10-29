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
export const E2E_ADMIN = {
  ...E2E_USER,
  id: "6650f0c2a1b2c3d4e5f60719",
  mobile: "09121111111",
  role: "admin",
};

/** What the admin pages read; the showroom never sees it (it sends no session cookie). */
export const E2E_CARPETS = [
  {
    slug: "kashan-red",
    name: "کاشان سرخ",
    material: "wool",
    widthCm: 200,
    lengthCm: 300,
    density: { unit: "raj", value: 50 },
    image: "/carpets/kashan-red.jpg",
    imageAspect: 0.6667,
    priceRial: 450_000_000,
    provenance: { origin: "کاشان" },
    isPlaceholder: false,
  },
  {
    slug: "navy-medallion",
    name: "ترنج سرمه‌ای",
    material: "machine",
    widthCm: 150,
    lengthCm: 225,
    image: "/carpets/navy-medallion.jpg",
    imageAspect: 0.6667,
    isPlaceholder: true,
  },
];

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

  const isAdmin = cookie.includes("access_token=e2e-admin");
  if (req.method === "GET" && req.url === "/v1/auth/me") {
    if (isAdmin) return json(200, { data: { user: E2E_ADMIN } });
    return cookie.includes("access_token=e2e-valid")
      ? json(200, { data: { user: E2E_USER } })
      : json(401, unauthenticated);
  }
  if (isAdmin && req.method === "GET" && req.url === "/v1/carpets?limit=100") {
    const meta = { page: 1, limit: 100, totalItems: E2E_CARPETS.length, totalPages: 1 };
    return json(200, { data: E2E_CARPETS, meta });
  }
  if (isAdmin && req.method === "GET" && req.url?.startsWith("/v1/carpets/")) {
    const carpet = E2E_CARPETS.find((c) => req.url === `/v1/carpets/${c.slug}`);
    return carpet
      ? json(200, { data: carpet })
      : json(404, { statusCode: 404, code: "NOT_FOUND", message: "فرش یافت نشد" });
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
