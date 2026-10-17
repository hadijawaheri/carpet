// Run from the repo root: pm2 startOrReload infra/ecosystem.config.cjs --update-env
const path = require("node:path");

const root = path.resolve(__dirname, "..");

module.exports = {
  apps: [
    {
      name: "farsh-api",
      cwd: path.join(root, "apps/api"), // the API reads its secrets from apps/api/.env
      script: "dist/main.js",
      // One worker keeps the in-memory rate limits exact (OTP 3/min, inquiries 5/min); cluster x2
      // would double them. Costs ~0.5s of downtime per deploy, which Caddy's lb_try_duration hides.
      // Move the throttler storage to Redis before raising instances.
      exec_mode: "fork",
      instances: 1,
      env: { NODE_ENV: "production" },
      max_memory_restart: "512M",
      kill_timeout: 10_000, // lets Nest finish in-flight requests (enableShutdownHooks)
      autorestart: true,
      time: true,
    },
    {
      name: "farsh-web",
      cwd: path.join(root, "apps/web"),
      script: ".next/standalone/apps/web/server.js",
      exec_mode: "cluster",
      instances: 2,
      env: {
        NODE_ENV: "production",
        PORT: "7782",
        HOSTNAME: "127.0.0.1",
        INTERNAL_API_URL: "http://127.0.0.1:7781",
      },
      max_memory_restart: "768M",
      kill_timeout: 10_000,
      autorestart: true,
      time: true,
    },
  ],
};
