#!/usr/bin/env bash
# Run on the server from the repo root. Stops before the PM2 reload if install, build, migrations
# or indexes fail.
# Note: `next build` rewrites .next while the old web process is still running; keep deploys short and off-peak.
set -euo pipefail

git pull --ff-only
corepack enable
pnpm install --frozen-lockfile
# INTERNAL_API_URL is baked into the Next rewrites at build time
INTERNAL_API_URL="http://127.0.0.1:7781" pnpm build
# (apps/web's postbuild copies public/ and .next/static beside the standalone server.js)
# Data migrations first (they may reshape what an index covers), then indexes; production boots
# with autoIndex off
pnpm --filter @farsh/api db:migrate
pnpm --filter @farsh/api db:indexes
pm2 startOrReload infra/ecosystem.config.cjs --update-env
pm2 save
