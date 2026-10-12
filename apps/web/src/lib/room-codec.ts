import { type RoomLayout, roomLayoutSchema } from "@farsh/contracts";

/** URL-safe base64 of the layout's JSON, so a room fits in a link with no server. */
export function encodeLayout(layout: RoomLayout): string {
  const bytes = new TextEncoder().encode(JSON.stringify(layout));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/** Returns null for anything that is not a valid layout: a hand-edited link must never break the page. */
export function decodeLayout(encoded: string): RoomLayout | null {
  try {
    const padded = encoded.replaceAll("-", "+").replaceAll("_", "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const parsed = roomLayoutSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
