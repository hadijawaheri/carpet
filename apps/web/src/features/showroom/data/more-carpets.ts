import type { Carpet } from "@farsh/contracts";

/** Carpets to suggest beside one: same material first, then the rest, in catalogue order. */
export function moreCarpets(carpet: Carpet, carpets: Carpet[], count = 4): Carpet[] {
  const others = carpets.filter((c) => c.slug !== carpet.slug);
  return [
    ...others.filter((c) => c.material === carpet.material),
    ...others.filter((c) => c.material !== carpet.material),
  ].slice(0, count);
}
