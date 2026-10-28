import "server-only";

import QRCode from "qrcode";

/**
 * A QR code as an SVG data URI. Rendered on the server and shown through <img>, so no script and no
 * inline markup reach the page; the CSP already allows data: images.
 */
export async function qrDataUri(text: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
