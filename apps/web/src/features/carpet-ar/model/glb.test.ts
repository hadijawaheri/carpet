import { describe, expect, it } from "vitest";

import { buildCarpetGlb } from "./glb";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);

function readGlb(glb: Uint8Array) {
  const data = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
  const jsonLength = data.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + jsonLength))) as {
    accessors: { bufferView: number; min?: number[]; max?: number[] }[];
    bufferViews: { byteOffset: number; byteLength: number }[];
    buffers: { byteLength: number }[];
    images: { bufferView: number; mimeType: string }[];
  };
  const binStart = 20 + jsonLength;
  const bin = glb.subarray(binStart + 8, binStart + 8 + data.getUint32(binStart, true));
  return { data, jsonLength, json, binStart, bin };
}

describe("buildCarpetGlb", () => {
  const glb = buildCarpetGlb({ widthM: 2, lengthM: 3 }, jpeg);
  const { data, jsonLength, json, binStart, bin } = readGlb(glb);

  it("writes a glTF 2 header whose length is the file's", () => {
    expect(data.getUint32(0, true)).toBe(0x46546c67);
    expect(data.getUint32(4, true)).toBe(2);
    expect(data.getUint32(8, true)).toBe(glb.byteLength);
  });

  it("keeps both chunks 4-byte aligned and typed", () => {
    expect(jsonLength % 4).toBe(0);
    expect(data.getUint32(16, true)).toBe(0x4e4f534a);
    expect(data.getUint32(binStart + 4, true)).toBe(0x004e4942);
    expect(bin.byteLength % 4).toBe(0);
    expect(bin.byteLength).toBe(json.buffers[0]!.byteLength);
    for (const view of json.bufferViews) expect(view.byteOffset % 4).toBe(0);
  });

  it("lays the carpet flat at its real size, centred on the floor", () => {
    const position = json.accessors[0]!;
    expect(position.min).toEqual([-1, 0, -1.5]);
    expect(position.max).toEqual([1, 0, 1.5]);
    const view = json.bufferViews[position.bufferView]!;
    const points = new Float32Array(
      bin.slice(view.byteOffset, view.byteOffset + view.byteLength).buffer,
    );
    expect(Array.from(points)).toEqual([-1, 0, -1.5, -1, 0, 1.5, 1, 0, 1.5, 1, 0, -1.5]);
  });

  it("embeds the photo unchanged", () => {
    const image = json.images[0]!;
    expect(image.mimeType).toBe("image/jpeg");
    const view = json.bufferViews[image.bufferView]!;
    expect(bin.subarray(view.byteOffset, view.byteOffset + view.byteLength)).toEqual(jpeg);
  });
});
