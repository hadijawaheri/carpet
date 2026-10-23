# 0009 · Security and operations baseline

Date: 2026-10-20 · Status: accepted, Redis, migration and Docker points superseded by 0010 (owner asked to close the gaps found in the architecture and security checklists)

- **OTPs go out through a Melipayamak pattern.** Patterns skip the ad filter and arrive fast; a failed send answers 503 `SMS_UNAVAILABLE` in Persian and clears the code. The endpoint (`console.melipayamak.com/api/send/shared/{key}`) has only been tested against a mock; verify it with the real panel before launch.
- **Every page renders per request, for a nonce CSP.** `src/proxy.ts` sets `script-src 'nonce-…' 'strict-dynamic'`; the root layout awaits `connection()` so Next can stamp the nonce. A static page would ship scripts the CSP blocks. The carpet list keeps its 60 s fetch cache, so the cost is server rendering, not API calls. Styles stay `'unsafe-inline'`: React and the 3D canvas write style attributes, which no nonce covers.
- **CSRF: SameSite=Lax plus an Origin check, no token.** The API rejects writes whose `Origin`/`Referer` is not in `CORS_ORIGINS`; that also covers a hostile subdomain, which SameSite treats as same-site. A token would add a round trip to every form for no extra protection here.
- **Sensitive actions need a fresh OTP**: deleting an account asks for a new code and revokes every session. Sessions also end 90 days after sign-in however often they are refreshed.
- **MongoDB runs with auth**; the API uses `farsh_app` (`readWrite` on `farsh` only). Root is used only by backups.
- **Redis is optional.** Without `REDIS_URL` the API runs as one process with in-memory rate limits; with it the counters are shared and PM2 may run the API in cluster mode. Redis holds nothing worth persisting.
- **Migrations are a small in-repo runner** (forward-only, ordered, locked) instead of `migrate-mongo`, which needs its own config and CommonJS. `deploy.sh` and the API image run migrations, then indexes, before the server.
- **PM2 stays the default; Docker images are an alternative** (`infra/docker/*.Dockerfile`, compose profile `app`, host networking so Caddy, the firewall and the replica set member address keep 127.0.0.1). The web app now builds `output: "standalone"`, which `ecosystem.config.cjs` already expected.
- **Server setup is one script** (`infra/server/setup.sh`): ufw (SSH rate-limited, 80, 443), a daily `mongodump` timer keeping 14 days (optionally rsynced off the server), `pm2 startup` and `pm2-logrotate`. Caddy rolls its own JSON log.
- Not done on purpose: file uploads/S3, job queues and WebSockets. Nothing in the shop needs them yet; carpet photos stay the owner's files in `public/carpets`.
