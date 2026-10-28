import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { qrDataUri } = await import("./qr");

describe("qrDataUri", () => {
  it("encodes the text as an SVG data URI", async () => {
    const uri = await qrDataUri("https://farsh.example/carpets/kashan-red/certificate");
    const [prefix, payload] = uri.split(",");
    expect(prefix).toBe("data:image/svg+xml;base64");
    const svg = Buffer.from(payload!, "base64").toString();
    expect(svg).toMatch(/^<svg[^>]+viewBox="0 0 \d+ \d+"/);
  });

  it("changes with the text, so each carpet gets its own code", async () => {
    const a = await qrDataUri("https://farsh.example/carpets/kashan-red/certificate");
    const b = await qrDataUri("https://farsh.example/carpets/navy-medallion/certificate");
    expect(a).not.toBe(b);
  });
});
