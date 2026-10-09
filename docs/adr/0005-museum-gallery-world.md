# 0005 · One visual world: the carpet museum gallery

Date: 2026-10-09 · Status: accepted

- Stage 2 read as a neutral design-system document, not a portfolio piece; the owner chose the "museum hall" direction for a full redesign.
- Madder-red walls, cream mount boards for every label and reading surface, saffron rails and focus on the wall, indigo focus on the mount. `bg-background` is the wall, `bg-card` the mount.
- One theme only: the light/dark toggle and `next-themes` are removed, because a gallery does not repaint its walls.
- Fonts: Markazi Text (Persian Naskh serif) for inscriptions, Vazirmatn for text and UI, Azeret Mono for accession numbers and measurements.
- The landing carpet hangs from its top edge (`ClothSolver.setHanging`), so lifting a lower corner shows the knotted back.
- Surface strategy lives in `apps/web/.impeccable/surfaces/`; it is development-only and never shipped.
