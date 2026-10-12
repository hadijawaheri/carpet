import { siteName } from "@/lib/seo";

export interface Caption {
  title: string;
  detail: string;
}

/**
 * Adds a band under a rendered room naming the carpet, its size and pile: a saved picture gets sent
 * to family or a seller, and without the name it is just a room.
 * Colours come from the site's tokens, so the band matches the page it was saved from.
 */
export async function captionImage(blob: Blob, caption: Caption): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = bitmap.width / 1200;
  const band = Math.round(96 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height + band;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;

  const tokens = getComputedStyle(document.documentElement);
  const token = (name: string) => tokens.getPropertyValue(name).trim();
  const font = getComputedStyle(document.body).fontFamily;
  const pad = Math.round(36 * scale);
  const top = bitmap.height;

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  ctx.fillStyle = token("--card");
  ctx.fillRect(0, top, canvas.width, band);
  ctx.fillStyle = token("--primary");
  ctx.fillRect(0, top, canvas.width, Math.max(2, Math.round(4 * scale)));

  ctx.direction = "rtl";
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillStyle = token("--card-foreground");
  ctx.font = `700 ${Math.round(28 * scale)}px ${font}`;
  ctx.fillText(caption.title, canvas.width - pad, top + band * 0.4);
  ctx.fillStyle = token("--muted-foreground");
  ctx.font = `400 ${Math.round(19 * scale)}px ${font}`;
  ctx.fillText(caption.detail, canvas.width - pad, top + band * 0.72);

  ctx.textAlign = "left";
  ctx.fillStyle = token("--primary");
  ctx.font = `700 ${Math.round(30 * scale)}px ${font}`;
  ctx.fillText(siteName, pad, top + band * 0.52);

  return new Promise((resolve) => canvas.toBlob((out) => resolve(out ?? blob), "image/png"));
}
