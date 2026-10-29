import "server-only";

import type { Carpet } from "@farsh/contracts";
import sharp from "sharp";

import { serverEnv } from "@/lib/env";
import { siteUrl } from "@/lib/seo";

// Quick Look and Scene Viewer both cap texture memory on older phones; 2048 px keeps the weave legible
const MAX_TEXTURE_PX = 2048;

/**
 * Where the server reads a photo. Never the request's own host: the model is cached for a year, and a
 * forged Host header would otherwise choose the picture every later visitor gets.
 */
function photoUrl(image: string): URL {
  // Uploaded photos sit behind the /api rewrite; go straight to the API instead of round-tripping
  if (image.startsWith("/api/")) {
    return new URL(`v1/${image.slice("/api/".length)}`, `${serverEnv.INTERNAL_API_URL}/`);
  }
  return new URL(image, siteUrl);
}

/** The carpet's own photo as a JPEG, the one image type both AR formats take. */
export async function carpetTexture(carpet: Pick<Carpet, "image">): Promise<Uint8Array> {
  const res = await fetch(photoUrl(carpet.image), { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Carpet photo ${carpet.image} answered ${res.status}`);
  const photo = Buffer.from(await res.arrayBuffer());
  const jpeg = await sharp(photo)
    .rotate()
    .resize({
      width: MAX_TEXTURE_PX,
      height: MAX_TEXTURE_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  return new Uint8Array(jpeg);
}
