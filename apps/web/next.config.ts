import type { NextConfig } from "next";

// Baked into the rewrites at build time; the browser only ever talks to this origin.
const apiOrigin = process.env.INTERNAL_API_URL ?? "http://localhost:7781";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
