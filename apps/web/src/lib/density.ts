import type { KnotDensity } from "@farsh/contracts";

import { formatNumber } from "@/lib/format";

// Tabriz raj: knots counted along 7 cm of the carpet's width.
const RAJ_SPAN_M = 0.07;

/**
 * Knots per square metre, or null when the length density is unknown.
 * Raj assumes square knots, so it is an estimate; shaneh × takham is exact.
 */
export function knotsPerSquareMetre(density: KnotDensity): number | null {
  if (density.unit === "shaneh") {
    return density.takham ? density.value * density.takham : null;
  }
  const perMetre = density.value / RAJ_SPAN_M;
  return Math.round(perMetre * perMetre);
}

export function formatDensity(density: KnotDensity): string {
  if (density.unit === "raj") return `${formatNumber(density.value)} رج`;
  const takham = density.takham ? ` · ${formatNumber(density.takham)} تراکم` : "";
  return `${formatNumber(density.value)} شانه${takham}`;
}
