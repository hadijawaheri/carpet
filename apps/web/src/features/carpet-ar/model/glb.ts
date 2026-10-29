import { type CarpetQuad, quadCorners } from "./carpet-quad";

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

const pad4 = (n: number) => (4 - (n % 4)) % 4;

/**
 * A binary glTF with one textured quad: what Android's Scene Viewer places on the floor. Written by
 * hand because it is a few dozen bytes of geometry; three.js's exporter needs a browser canvas.
 */
export function buildCarpetGlb(quad: CarpetQuad, jpeg: Uint8Array): Uint8Array {
  const corners = quadCorners(quad);
  const positions = new Float32Array(corners.flatMap((c) => [...c.position]));
  const normals = new Float32Array(corners.flatMap(() => [0, 1, 0]));
  const uvs = new Float32Array(corners.flatMap((c) => [c.u, c.v]));
  // Counter-clockwise seen from above (+y), so the photo faces up
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  const views: { bytes: Uint8Array; target?: number }[] = [
    { bytes: new Uint8Array(positions.buffer), target: 34962 },
    { bytes: new Uint8Array(normals.buffer), target: 34962 },
    { bytes: new Uint8Array(uvs.buffer), target: 34962 },
    { bytes: new Uint8Array(indices.buffer), target: 34963 },
    { bytes: jpeg },
  ];
  let offset = 0;
  const bufferViews = views.map(({ bytes, target }) => {
    const view = {
      buffer: 0,
      byteOffset: offset,
      byteLength: bytes.byteLength,
      ...(target ? { target } : {}),
    };
    offset += bytes.byteLength + pad4(bytes.byteLength);
    return view;
  });
  const binLength = offset;

  const json = {
    asset: { version: "2.0", generator: "farsh" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "carpet" }],
    meshes: [
      {
        primitives: [
          { attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 },
        ],
      },
    ],
    materials: [
      {
        name: "carpet",
        doubleSided: true,
        pbrMetallicRoughness: {
          baseColorTexture: { index: 0 },
          metallicFactor: 0,
          roughnessFactor: 1,
        },
      },
    ],
    textures: [{ source: 0, sampler: 0 }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: 4, mimeType: "image/jpeg" }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 4,
        type: "VEC3",
        min: [-quad.widthM / 2, 0, -quad.lengthM / 2],
        max: [quad.widthM / 2, 0, quad.lengthM / 2],
      },
      { bufferView: 1, componentType: 5126, count: 4, type: "VEC3" },
      { bufferView: 2, componentType: 5126, count: 4, type: "VEC2" },
      { bufferView: 3, componentType: 5123, count: 6, type: "SCALAR" },
    ],
    bufferViews,
    buffers: [{ byteLength: binLength }],
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonLength = jsonBytes.byteLength + pad4(jsonBytes.byteLength);
  const total = 12 + 8 + jsonLength + 8 + binLength;
  const out = new Uint8Array(total);
  const data = new DataView(out.buffer);
  data.setUint32(0, GLB_MAGIC, true);
  data.setUint32(4, 2, true);
  data.setUint32(8, total, true);
  data.setUint32(12, jsonLength, true);
  data.setUint32(16, CHUNK_JSON, true);
  out.set(jsonBytes, 20);
  // The JSON chunk is padded with spaces, as the spec requires
  out.fill(0x20, 20 + jsonBytes.byteLength, 20 + jsonLength);
  const binStart = 20 + jsonLength;
  data.setUint32(binStart, binLength, true);
  data.setUint32(binStart + 4, CHUNK_BIN, true);
  for (const [i, view] of bufferViews.entries()) {
    out.set(views[i]!.bytes, binStart + 8 + view.byteOffset);
  }
  return out;
}
