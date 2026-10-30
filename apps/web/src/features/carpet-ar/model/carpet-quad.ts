import type { Carpet } from "@farsh/contracts";

/**
 * A carpet in AR is one flat rectangle at its catalogue size with the owner's photo on it; nothing
 * about the carpet is drawn or modelled. Width runs along x, length along z, the floor is y = 0.
 */
export interface CarpetQuad {
  widthM: number;
  lengthM: number;
}

export const carpetQuad = (carpet: Pick<Carpet, "widthCm" | "lengthCm">): CarpetQuad => ({
  widthM: carpet.widthCm / 100,
  lengthM: carpet.lengthCm / 100,
});

/**
 * Corners in the order both formats use: far-left, near-left, near-right, far-right, seen from above
 * with the photo's top edge at the far end. `v` is measured from the photo's top (glTF's convention).
 */
export function quadCorners({ widthM, lengthM }: CarpetQuad) {
  const x = widthM / 2;
  const z = lengthM / 2;
  return [
    { position: [-x, 0, -z], u: 0, v: 0 },
    { position: [-x, 0, z], u: 0, v: 1 },
    { position: [x, 0, z], u: 1, v: 1 },
    { position: [x, 0, -z], u: 1, v: 0 },
  ] as const;
}
