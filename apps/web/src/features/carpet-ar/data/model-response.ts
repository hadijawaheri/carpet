import "server-only";

import { NextResponse } from "next/server";

import { getCarpet } from "@/features/showroom/data/get-carpets";
import { paths } from "@/lib/paths";

import { type CarpetQuad, carpetQuad } from "../model/carpet-quad";
import { modelVersion } from "../model/model-version";
import { carpetTexture } from "./carpet-texture";

type Build = (quad: CarpetQuad, jpeg: Uint8Array) => Uint8Array;

/**
 * Serves a carpet's AR model. Only the current version's URL is cached (forever); an old or missing
 * `v`, or any other query, is sent to the current one, so a phone never places a carpet with last week's photo.
 */
export async function modelResponse(
  request: Request,
  slug: string,
  format: "glb" | "usdz",
  build: Build,
): Promise<Response> {
  const carpet = await getCarpet(slug);
  if (!carpet) return new NextResponse(null, { status: 404 });

  const version = modelVersion(carpet);
  const current = paths.carpetModel(slug, format, version);
  // Exactly the current URL or a redirect to it: any extra query would miss the CDN and rebuild
  if (new URL(request.url).search !== new URL(current, "http://x").search) {
    // Relative, so the redirect never names a host taken from the request
    return new NextResponse(null, {
      status: 307,
      headers: { Location: current, "Cache-Control": "no-store" },
    });
  }

  const body = build(carpetQuad(carpet), await carpetTexture(carpet));
  return new NextResponse(Buffer.from(body), {
    headers: {
      "Content-Type": format === "glb" ? "model/gltf-binary" : "model/vnd.usdz+zip",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${slug}.${format}"`,
    },
  });
}
