import type { PileMaterial } from "@farsh/contracts";

// Kept out of the "use client" toggle so server components get the real object, not a client reference.
export const materialLabels: Record<PileMaterial, string> = {
  silk: "ابریشم",
  wool: "پشم دستباف",
  machine: "ماشینی",
};
