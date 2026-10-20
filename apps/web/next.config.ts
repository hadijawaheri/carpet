import path from "node:path";

import type { NextConfig } from "next";

// Baked into the rewrites at build time; the browser only ever talks to this origin.
const apiOrigin = process.env.INTERNAL_API_URL ?? "http://localhost:7781";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // PM2 and the Docker image run .next/standalone/apps/web/server.js; tracing from the repo root
  // pulls in the workspace packages it imports
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  reactCompiler: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
