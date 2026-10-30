import { describe, expect, it } from "vitest";

import { buildCarpetUsdz, carpetUsda } from "./usdz";
import { crc32 } from "./zip";

const jpeg = new Uint8Array(Array.from({ length: 1000 }, (_, i) => i % 251));

interface Entry {
  name: string;
  dataStart: number;
  size: number;
  crc: number;
}

/** Reads the archive the way a strict reader does: through the central directory. */
function readZip(zip: Uint8Array): Entry[] {
  const data = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const end = zip.byteLength - 22;
  expect(data.getUint32(end, true)).toBe(0x06054b50);
  const count = data.getUint16(end + 10, true);
  let at = data.getUint32(end + 16, true);
  const entries: Entry[] = [];
  for (let i = 0; i < count; i += 1) {
    expect(data.getUint32(at, true)).toBe(0x02014b50);
    expect(data.getUint16(at + 10, true)).toBe(0);
    const nameLength = data.getUint16(at + 28, true);
    const name = new TextDecoder().decode(zip.subarray(at + 46, at + 46 + nameLength));
    const local = data.getUint32(at + 42, true);
    expect(data.getUint32(local, true)).toBe(0x04034b50);
    const dataStart =
      local + 30 + data.getUint16(local + 26, true) + data.getUint16(local + 28, true);
    entries.push({
      name,
      dataStart,
      size: data.getUint32(at + 24, true),
      crc: data.getUint32(at + 16, true),
    });
    at += 46 + nameLength + data.getUint16(at + 30, true) + data.getUint16(at + 32, true);
  }
  return entries;
}

describe("buildCarpetUsdz", () => {
  const quad = { widthM: 1.5, lengthM: 2.25 };
  const usdz = buildCarpetUsdz(quad, jpeg);
  const entries = readZip(usdz);

  it("puts the scene first and the photo beside it", () => {
    expect(entries.map((e) => e.name)).toEqual(["carpet.usda", "textures/carpet.jpg"]);
  });

  it("starts every file on a 64-byte boundary, uncompressed and with a correct CRC", () => {
    for (const entry of entries) {
      expect(entry.dataStart % 64).toBe(0);
      const bytes = usdz.subarray(entry.dataStart, entry.dataStart + entry.size);
      expect(crc32(bytes)).toBe(entry.crc);
    }
    const photo = entries[1]!;
    expect(usdz.subarray(photo.dataStart, photo.dataStart + photo.size)).toEqual(jpeg);
  });

  it("describes the carpet in metres with the photo the right way up", () => {
    const usda = carpetUsda(quad);
    expect(usda).toContain("metersPerUnit = 1");
    expect(usda).toContain('upAxis = "Y"');
    expect(usda).toContain(
      "points = [(-0.75, 0, -1.125), (-0.75, 0, 1.125), (0.75, 0, 1.125), (0.75, 0, -1.125)]",
    );
    // The far edge carries the photo's top, which is t = 1 in USD
    expect(usda).toContain("primvars:st = [(0, 1), (0, 0), (1, 0), (1, 1)]");
  });
});

describe("crc32", () => {
  it("matches the standard check value", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});
