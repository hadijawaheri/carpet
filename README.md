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
  features/showroom/      the Heritage Loom page: header, hero, gallery, room preview, drawer,
                          and /carpets/[slug], each carpet's shareable page (docs/adr/0012)
  features/encyclopedia/  /encyclopedia: articles on knots, density, materials and price
  features/inquiry/       inquiry form → POST /api/inquiries
  features/newsletter/    newsletter form → POST /api/newsletter/subscriptions
  features/account/       /sign-in (OTP), /dashboard/profile: profile, logout, delete with a fresh code
  features/catalogue-admin/ /dashboard/catalogue (admin): add, edit and remove carpets and their photos
  lib/auth/dal.ts         getSession / requireSession for Server Components (server-only)
  proxy.ts                per-request CSP nonce, sign-in redirect and access-cookie refresh
apps/api/src/             NestJS: config, common (guards, pipe, filter, origin check), infra/sms, health,
                          modules/{auth,users,carpets,inquiries,newsletter}
apps/api/migrations/      migrate-mongo migrations (db:migrate, db:migrate:status, db:migrate:create)
packages/contracts/       Zod schemas shared by web and api, carpet catalogue, material presets
infra/                    PM2 ecosystem, Caddyfile, mongo/ (production mongod.conf, replica set init),
                          docker-compose (dev Mongo only), server/ (MongoDB install, firewall, backups, pm2)
scripts/deploy.sh         pull → install → build → migrations → indexes → pm2 reload
scripts/backup-db.sh      daily mongodump archive (restore-db.sh puts one back)
docs/adr/                 decisions
```

## Production server

No Docker in production (docs/adr/0010). Once, as root: fill `infra/.env`, then `infra/server/setup-mongo.sh` (MongoDB 8 on 127.0.0.1:27017, replica set, auth) and `infra/server/setup.sh <deploy-user>` (ufw, daily backup timer, `pm2 startup`, `pm2-logrotate`). Fill `apps/api/.env` (`NODE_ENV=production`, `DATABASE_URL` as printed by setup-mongo, `SMS_PROVIDER=melipayamak`, `CORS_ORIGINS=https://<domain>`, optional `SENTRY_DSN`) and `apps/web/.env.local` (see `.env.example`), set `SITE_ADDRESS` for Caddy, then `scripts/deploy.sh`. See docs/adr/0009 and 0010.

## Git

Trunk-based: short branches (`feat/…`, `fix/…`) → PR → squash merge into `main`, which is always deployable. Conventional Commits, checked by commitlint.
