# Deploying with the web app on Vercel and the API on 141.11.107.22

The owner's chosen split (2026-10): Vercel serves the Next.js site; the NestJS API, MongoDB and uploaded
photos live on the owner's server at `141.11.107.22`. This guide is the checklist for that split. Nothing in it
has been run yet. The single-server setup in the README stays valid, and most steps below reuse it.

```text
browser ── https://<site domain> ──► Vercel (Next.js)
                                        │  /api/* rewrite (server side, same origin for the browser)
                                        ▼
                         https://api.<domain> ──► Caddy on 141.11.107.22 ──► API 127.0.0.1:7781 ──► MongoDB 127.0.0.1:27017
                                                                                   └─► MEDIA_DIR (photos)
```

## Before you start: decisions and prerequisites

1. **A domain for the API.** Vercel's rewrite needs an HTTPS origin, and Caddy can only get a certificate for a
   name, not for a bare IP. Create an `A` record such as `api.<domain>` → `141.11.107.22`.
2. **Client IPs and rate limits (must be settled before go-live).** Every browser call reaches the API through
   Vercel, so the address Caddy sees is a Vercel egress IP shared by many visitors. The API trusts one proxy hop
   (`apps/api/src/configure-app.ts`), so today the OTP limit (3 a minute) and the inquiry limit (5 a minute) would
   count all visitors together. Options, in order of preference:
   - keep the per-IP limits but trust the visitor address Vercel puts in `X-Forwarded-For`, and only accept
     traffic to `api.<domain>` that carries a secret header added by the web app's `proxy.ts` (needs a small code
     change and a new secret in Vercel and `apps/api/.env`);
   - or key the OTP limit on the phone number as well as the IP (already the stronger control for SMS cost).
     This is a code change and gets its own PR before the server goes live.
3. **SMS:** sign-in needs Melipayamak (`SMS_PROVIDER=melipayamak`, API key, approved pattern id). Until then use
   `SMS_PROVIDER=disabled`: the site works and sign-in answers 503.

## On the server (once, as root)

1. `infra/.env` from `infra/.env.example`, then `infra/server/setup-mongo.sh` (MongoDB 8 on loopback, replica
   set, auth) and `infra/server/setup.sh <deploy-user>` (ufw: only SSH, 80 and 443; daily DB backup; PM2 at boot).
2. Clone the repo as the deploy user, then fill `apps/api/.env`:
   - `NODE_ENV=production`, `HOST=127.0.0.1`, `PORT=7781`
   - `DATABASE_URL` as printed by `setup-mongo.sh`
   - `JWT_ACCESS_SECRET`, `OTP_HMAC_SECRET`: `openssl rand -base64 48` each
   - `CORS_ORIGINS=https://<site domain>` plus any other origin that serves the site (the Vercel production
     domain if visitors can reach it). Writes from any other `Origin` get 403. Preview deployments are not
     listed, so their forms cannot write to production; point previews at a staging API if they need to.
   - `MEDIA_DIR=/var/lib/farsh/media` (create it, owned by the deploy user). It must live **outside** the
     release folder so a fresh clone or `git clean` never deletes photos.
   - `SMS_PROVIDER` as above; optional `SENTRY_DSN`.
3. **Back up the photos too.** The daily timer only dumps MongoDB. Add `MEDIA_DIR` to whatever copies backups
   off the server (e.g. `rsync -a /var/lib/farsh/media/ <backup host>`); photos are content-addressed, so
   copies are append-only and cheap.
4. **Run only the API under PM2:** `pnpm install --frozen-lockfile && pnpm --filter @farsh/contracts build &&
pnpm --filter @farsh/api build`, then `pnpm --filter @farsh/api db:migrate && pnpm --filter @farsh/api
db:indexes`, then `pm2 start infra/ecosystem.config.cjs --only farsh-api && pm2 save`. (`scripts/deploy.sh`
   builds and reloads the web app too; on this server use the API-only commands above.)
5. **Caddy** for the API name only, e.g. `/etc/caddy/Caddyfile`:

   ```caddyfile
   api.<domain> {
   	encode zstd gzip
   	request_body {
   		max_size 16MB # photo uploads are capped at 15 MB by the API
   	}
   	reverse_proxy 127.0.0.1:7781
   	header -Server
   }
   ```

   Caddy fetches and renews the certificate itself once DNS points at the server.

6. Check from outside: `curl https://api.<domain>/health/ready` answers (it also pings MongoDB), and nothing else is reachable
   (`nmap 141.11.107.22` shows only the SSH port, 80 and 443).

## On Vercel

1. Project root `apps/web` (already set). Environment variables for Production:
   - `INTERNAL_API_URL=https://api.<domain>`: **baked into the `/api` rewrite at build time**, so redeploy after
     changing it.
   - `NEXT_PUBLIC_SITE_URL=https://<site domain>`: used for canonical links, QR codes and the AR models'
     photo fetch.
2. Redeploy, then check: home page lists the carpets from the API, `/api/carpets` answers JSON, an uploaded
   photo loads at `/api/media/carpets/<file>`, and `/carpets/<slug>/model.glb` downloads.
3. Request size: Vercel limits a proxied request body to about 4.5 MB. The admin form already shrinks photos above
   4 MB in the browser (docs/adr/0016), so uploads fit.

## Deploying updates

- API: on the server, `git pull --ff-only`, the install/build/migrate/indexes commands from step 4, then
  `pm2 reload farsh-api`.
- Web: merging to `main` deploys on Vercel. A change that needs a new API endpoint must reach the server first.
