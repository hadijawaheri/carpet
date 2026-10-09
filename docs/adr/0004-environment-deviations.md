# 0004 · Deviations forced by the build environment

Date: 2026-10-09 · Status: accepted, revisit on the owner's machine

- shadcn's registry (ui.shadcn.com) was unreachable where the skeleton was built, so `button` and `direction` were written by hand from shadcn's source pattern. Re-run `pnpm dlx shadcn@latest add button direction --overwrite` once the registry is reachable and keep the Farsh variants.
- pnpm 10 is installed, so build-script approval uses `onlyBuiltDependencies`; switch to `allowBuilds` on pnpm 11 (blueprint §13).
- Node 22 is the runtime here; `.nvmrc` can move to the current LTS.
