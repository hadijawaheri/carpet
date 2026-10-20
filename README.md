# Farsh · فرش

A showroom for Iranian carpets in the Heritage Loom design (docs/adr/0007): 3D carpets you can grab and shake, silk vs wool vs machine-made feel, and research articles on knots, shaneh and raj.

## Stack

pnpm workspace · Next.js (App Router) · React Three Fiber + drei · shadcn/ui (Radix) + Tailwind v4 · NestJS + MongoDB API · Zod contracts. Persian, RTL.

## Develop

```bash
corepack enable
pnpm install
pnpm --filter @farsh/contracts build
pnpm dev            # web http://localhost:7782, api http://127.0.0.1:7781
```

The API needs MongoDB and `apps/api/.env`; see [apps/api/README.md](apps/api/README.md) (`cp infra/.env.example infra/.env`, `docker compose -f infra/docker-compose.yml up -d`, then `pnpm --filter @farsh/api seed`).

Checks: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## shadcn

`components.json` has `"rtl": true`. Style `new-york`, base colour `stone`, colours replaced by the Farsh tokens in `apps/web/src/app/globals.css`. Add components with `pnpm dlx shadcn@latest add <name>` from `apps/web`.

## Layout

```text
apps/web/src/
  app/                    routing only
  components/ui/          shadcn components
  features/carpet-viewer/ cloth solver, knot normal maps, pointer tilt, R3F scene
  features/showroom/      the Heritage Loom page: header, hero, gallery, room preview, drawer
  features/inquiry/       inquiry form → POST /api/inquiries
  features/newsletter/    newsletter form → POST /api/newsletter/subscriptions
  features/account/       /account: OTP sign-in, profile, logout, delete with a fresh code
  proxy.ts                per-request CSP nonce
apps/api/src/             NestJS: config, common (guards, pipe, filter, origin check), infra/{sms,redis},
                          database (migrations), health, modules/{auth,users,carpets,inquiries,newsletter}
packages/contracts/       Zod schemas shared by web and api, carpet catalogue, material presets
infra/                    PM2 ecosystem, Caddyfile, docker-compose (Mongo with auth, Redis, optional app
                          profile), docker/ (web and api images), server/ (firewall, backups, pm2 boot)
scripts/deploy.sh         pull → install → build → migrations → indexes → pm2 reload
scripts/backup-db.sh      daily mongodump archive (restore-db.sh puts one back)
docs/adr/                 decisions
```

## Production server

Once, as root: `infra/server/setup.sh <deploy-user>` (ufw, daily backup timer, `pm2 startup`, `pm2-logrotate`). Fill `infra/.env` and `apps/api/.env` (`NODE_ENV=production`, `SMS_PROVIDER=melipayamak`, `CORS_ORIGINS=https://<domain>`, optional `REDIS_URL`), set `SITE_ADDRESS` for Caddy, then `docker compose -f infra/docker-compose.yml up -d` and `scripts/deploy.sh`. See docs/adr/0009.
