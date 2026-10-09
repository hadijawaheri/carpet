# Farsh · فرش

A portfolio site for Iranian carpets: 3D carpets you can grab and shake, silk vs wool vs machine-made feel, and research articles on knots, shaneh and raj.

## Stack

pnpm workspace · Next.js (App Router) · React Three Fiber + drei · shadcn/ui (Radix) + Tailwind v4 · Zod contracts. Persian, RTL.

## Develop

```bash
corepack enable
pnpm install
pnpm --filter @farsh/contracts build
pnpm dev            # http://localhost:7782
```

Checks: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## shadcn

`components.json` has `"rtl": true`. Style `new-york`, base colour `stone`, colours replaced by the Farsh tokens in `apps/web/src/app/globals.css`. Add components with `pnpm dlx shadcn@latest add <name>` from `apps/web`.

## Layout

```text
apps/web/src/
  app/                    routing only
  components/ui/          shadcn components
  features/carpet-viewer/ cloth solver, knot normal maps, R3F scene
  features/catalog/       carpet data (placeholder photos for now)
packages/contracts/       carpet schema, material presets
docs/adr/                 decisions
```
