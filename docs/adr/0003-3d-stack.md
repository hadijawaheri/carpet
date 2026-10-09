# 0003 · React Three Fiber with a hand-written cloth solver

Date: 2026-10-09 · Status: accepted

- `three`, `@react-three/fiber`, `@react-three/drei` render the carpet. R3F keeps the scene inside the React feature folder.
- The cloth is a ~200-line Verlet solver (`cloth-solver.ts`) instead of cannon-es or rapier: one sheet needs no physics engine, and the solver is unit-tested.
- Feel presets (silk, wool, machine) live in `packages/contracts` and drive both physics and material. Values are hand-tuned, not measured.
- Lighting uses drei `Lightformer`s, not an HDR preset: presets download from a third-party CDN at runtime.
