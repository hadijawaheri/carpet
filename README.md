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

The API needs MongoDB and `apps/api/.env`; see [apps/api/README.md](apps/api/README.md) (`docker compose -f infra/docker-compose.yml up -d`, then `pnpm --filter @farsh/api seed`).

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
apps/api/src/             NestJS: config, common (guards, pipe, filter), infra/sms, health,
                          modules/{auth,users,carpets,inquiries,newsletter}
packages/contracts/       Zod schemas shared by web and api, carpet catalogue, material presets
infra/                    PM2 ecosystem, Caddyfile, docker-compose (dev Mongo)
scripts/deploy.sh         pull → install → build → indexes → pm2 reload
docs/adr/                 decisions
```
