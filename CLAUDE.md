# Farsh — Agent Rules

Source of truth: PROJECT_BLUEPRINT_SHADCN.md (kept outside this repo). This file is the short, always-loaded subset.

## Commands

- `pnpm dev` | `pnpm typecheck` | `pnpm lint` | `pnpm test` | `pnpm build`
- Build `@farsh/contracts` before typechecking the web app: `pnpm --filter @farsh/contracts build`.
- Use pnpm only. The lockfile is committed. TypeScript and ESLint are pinned in the pnpm catalog on purpose.

## Architecture

- apps/web (Next.js App Router :7782), packages/contracts (Zod, shared). No apps/api yet (docs/adr/0002).
- Data shapes (carpets, materials, presets) live ONLY in packages/contracts.
- 3D lives in apps/web/src/features/carpet-viewer. `cloth-solver.ts` stays free of React and three.js.
- Carpet images come only from the owner's photos in apps/web/public/carpets. Never draw or generate a carpet.

## Code

- TS strict, no `any`, `catch (e: unknown)`. kebab-case files, named exports, no `I` prefix.
- Comments explain WHY only. Imports are sorted by ESLint.
- `page.tsx` = routing only. `"use client"` only on leaves.
- React Compiler is on: mutate simulation state through methods on objects created in `useMemo`, never by assigning props during render.

## UI (shadcn, RTL)

- Semantic tokens only (globals.css). No raw colors in components, no `dark:` overrides, no `space-x/y`.
- Logical classes only (ms/me/ps/pe/start/end). Directional icons: `rtl:rotate-180`.
- UI copy is Persian; code, names, comments and commits are English.

## Done means

typecheck + lint + tests actually run and green, build passes, loading/empty/error states handled, ADR for new decisions.
