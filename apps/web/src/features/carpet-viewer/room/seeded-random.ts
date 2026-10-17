/** Park–Miller generator: the same seed lays out the same leaves, books and floorboards. */
export function seededRandom(seed: number) {
  let state = Math.max(1, Math.abs(Math.round(seed)) % 2147483647);
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}
