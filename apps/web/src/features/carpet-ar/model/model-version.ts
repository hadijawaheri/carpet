import type { Carpet } from "@farsh/contracts";

/**
 * Changes whenever the photo or the size does, so a model URL can be cached forever and a new photo
 * still reaches phones at once. FNV-1a: short and stable, not a security measure.
 */
export function modelVersion(carpet: Pick<Carpet, "image" | "widthCm" | "lengthCm">): string {
  let hash = 0x811c9dc5;
  for (const char of `${carpet.image}|${carpet.widthCm}|${carpet.lengthCm}`) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
