import { CanvasTexture, NoColorSpace, RepeatWrapping } from "three";

const SIZE = 256;
const KNOTS_PER_TILE = 8;

/**
 * A tileable normal map of 8 × 8 knots. Hand-knotted rows wobble and each knot is a slightly
 * uneven pair of loops; machine knots sit on a perfect grid. Browser only (needs a canvas).
 */
export function createKnotNormalMap(handKnotted: boolean) {
  const cell = SIZE / KNOTS_PER_TILE;
  const height = new Float32Array(SIZE * SIZE);
  let seed = handKnotted ? 7 : 3;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lobes = handKnotted ? [-0.2, 0.2] : [0];
  const rx = handKnotted ? cell * 0.24 : cell * 0.36;
  const ry = handKnotted ? cell * 0.42 : cell * 0.36;

  for (let ky = 0; ky < KNOTS_PER_TILE; ky++) {
    for (let kx = 0; kx < KNOTS_PER_TILE; kx++) {
      const jx = handKnotted ? (random() - 0.5) * cell * 0.18 : 0;
      const jy = handKnotted ? (random() - 0.5) * cell * 0.18 : 0;
      for (const lobe of lobes) {
        const cx = (kx + 0.5) * cell + jx + lobe * cell;
        const cy = (ky + 0.5) * cell + jy;
        for (let y = Math.floor(cy - ry * 1.6); y <= cy + ry * 1.6; y++) {
          for (let x = Math.floor(cx - rx * 1.6); x <= cx + rx * 1.6; x++) {
            const dx = (x - cx) / rx;
            const dy = (y - cy) / ry;
            const i = (((y % SIZE) + SIZE) % SIZE) * SIZE + (((x % SIZE) + SIZE) % SIZE);
            height[i] = Math.max(height[i]!, Math.exp(-(dx * dx + dy * dy) * 1.4));
          }
        }
      }
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is not available");
  const image = context.createImageData(SIZE, SIZE);
  const h = (x: number, y: number) => height[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)]!;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const nx = (h(x - 1, y) - h(x + 1, y)) * 2.2;
      const ny = (h(x, y + 1) - h(x, y - 1)) * 2.2;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * SIZE + x) * 4;
      image.data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = NoColorSpace;
  return texture;
}

export const KNOTS_PER_NORMAL_TILE = KNOTS_PER_TILE;
