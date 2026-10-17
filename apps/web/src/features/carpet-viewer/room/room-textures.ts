import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

import type { FloorKind } from "./room-config";
import { seededRandom } from "./seeded-random";

/**
 * Floors, plaster and fringe drawn on canvases at load, so a room needs no texture downloads and
 * none of it is a photo. Browser only.
 */
export interface FloorFinish {
  map: CanvasTexture;
  /** Metres of floor one texture tile covers. */
  tile: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  /** Turns the tile, e.g. herringbone runs at 45° to the canvas. */
  rotation: number;
}

function canvas(size: number) {
  const element = document.createElement("canvas");
  element.width = element.height = size;
  const context = element.getContext("2d");
  if (!context) throw new Error("2D canvas is not available");
  return { element, context };
}

function finish(element: HTMLCanvasElement) {
  const texture = new CanvasTexture(element);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/** Periodic value noise, so the canvas tiles without seams. */
function periodicNoise(seed: number, period: number) {
  const random = seededRandom(seed);
  const lattice = Float32Array.from({ length: period * period }, () => random());
  const at = (x: number, y: number) =>
    lattice[(((y % period) + period) % period) * period + (((x % period) + period) % period)]!;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = smooth(x - x0);
    const fy = smooth(y - y0);
    const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
    const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
    return top * (1 - fy) + bottom * fy;
  };
}

/** Fractal noise over [0, 1)² that wraps at the edges. */
function fbm(seed: number, base: number, octaves: number) {
  const layers = Array.from({ length: octaves }, (_, i) => ({
    noise: periodicNoise(seed + i * 31, base * 2 ** i),
    scale: base * 2 ** i,
    weight: 0.5 ** i,
  }));
  const total = layers.reduce((sum, l) => sum + l.weight, 0);
  return (u: number, v: number) =>
    layers.reduce((sum, l) => sum + l.noise(u * l.scale, v * l.scale) * l.weight, 0) / total;
}

type Rgb = [number, number, number];

function shade([r, g, b]: Rgb, amount: number, alpha = 1) {
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, c * amount)));
  return `rgba(${f(r)}, ${f(g)}, ${f(b)}, ${alpha})`;
}

/** Draws a rectangle and its copies across the wrap, so pieces crossing an edge tile cleanly. */
function wrapped(size: number, x: number, y: number, draw: (x: number, y: number) => void) {
  for (const dx of [-size, 0, size]) {
    for (const dy of [-size, 0, size]) {
      draw(x + dx, y + dy);
    }
  }
}

function drawPlank(
  context: CanvasRenderingContext2D,
  random: () => number,
  base: Rgb,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const along = w >= h;
  const tone = 0.86 + random() * 0.24;
  context.fillStyle = shade(base, tone);
  context.fillRect(x, y, w, h);
  // Grain: long, slightly wavy streaks along the board.
  const streaks = Math.round((along ? h : w) * 0.6);
  for (let i = 0; i < streaks; i++) {
    const offset = random() * (along ? h : w);
    context.strokeStyle = shade(base, tone * (0.7 + random() * 0.45), 0.18 + random() * 0.2);
    context.lineWidth = 0.5 + random() * 1.4;
    context.beginPath();
    const length = along ? w : h;
    const wave = random() * 2.5;
    const phase = random() * 6;
    for (let t = 0; t <= length; t += 6) {
      const swing = Math.sin(t / (18 + wave * 9) + phase) * wave;
      const px = along ? x + t : x + offset + swing;
      const py = along ? y + offset + swing : y + t;
      if (t === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.stroke();
  }
  // A knot now and then.
  if (random() < 0.25) {
    const kx = x + random() * w;
    const ky = y + random() * h;
    context.fillStyle = shade(base, tone * 0.6, 0.35);
    context.beginPath();
    context.ellipse(kx, ky, along ? 6 : 3, along ? 3 : 6, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = shade(base, 0.45, 0.55);
  context.lineWidth = 1.2;
  context.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function oak(): FloorFinish {
  const size = 1024;
  const { element, context } = canvas(size);
  const random = seededRandom(11);
  const base: Rgb = [196, 158, 112];
  const boards = 10;
  const boardWidth = size / boards;
  for (let column = 0; column < boards; column++) {
    const start = -random() * size;
    let y = start;
    // Boards fill exactly one period, so the wrapped copies meet without overlap.
    while (y < start + size - 1) {
      const length = Math.min(size * (0.55 + random() * 0.5), start + size - y);
      wrapped(size, column * boardWidth, y, (px, py) =>
        drawPlank(
          context,
          seededRandom(Math.round(y * 7 + column * 131)),
          base,
          px,
          py,
          boardWidth,
          length,
        ),
      );
      y += length;
    }
  }
  return {
    map: finish(element),
    tile: 1.8,
    roughness: 0.5,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
    rotation: 0,
  };
}

function herringbone(): FloorFinish {
  const size = 1024;
  const { element, context } = canvas(size);
  const ratio = 6;
  // The staircase lattice (w, w) + (L, −L) repeats every 2L, so the canvas is 2L square.
  const width = size / (2 * ratio);
  const length = width * ratio;
  const base: Rgb = [116, 78, 54];
  for (let i = -2 * ratio; i < 4 * ratio; i++) {
    for (let b = -2; b <= 2; b++) {
      const ox = i * width + b * length;
      const oy = i * width - b * length;
      // Pieces one period apart are the same board, so they share a seed and the tile has no seam.
      const seed = 97 + ((((i - ratio * b) % (2 * ratio)) + 2 * ratio) % (2 * ratio));
      drawPlank(context, seededRandom(seed), base, ox, oy, length, width);
      drawPlank(context, seededRandom(seed + 5000), base, ox, oy + width, width, length);
    }
  }
  return {
    map: finish(element),
    tile: 1.2,
    roughness: 0.55,
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
    rotation: Math.PI / 4,
  };
}

function marble(): FloorFinish {
  const size = 512;
  const { element, context } = canvas(size);
  const image = context.createImageData(size, size);
  const veins = fbm(5, 3, 5);
  const cloud = fbm(9, 2, 4);
  const tiles = 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const tile = Math.floor(u * tiles) + Math.floor(v * tiles) * tiles;
      // Each slab is cut at its own angle, so veins break at the joints like real stone.
      const angle = tile * 1.3 + 0.4;
      const along = u * Math.cos(angle) + v * Math.sin(angle);
      // Few, soft veins: Carrara reads as a pale field with grey drift, not a pattern.
      const vein = Math.abs(Math.sin((along * 2.2 + veins(u, v) * 2.4) * Math.PI));
      const line = Math.pow(1 - vein, 40) * 0.22 + Math.pow(1 - vein, 160) * 0.18;
      const mottle = (cloud(u, v) - 0.5) * 0.07;
      const grout =
        Math.min((u * size) % (size / tiles), (v * size) % (size / tiles)) < 1.2 ? 0.1 : 0;
      const value = 0.93 + mottle - line - grout;
      const i = (y * size + x) * 4;
      image.data[i] = 236 * value;
      image.data[i + 1] = 233 * value;
      image.data[i + 2] = 228 * value;
      image.data[i + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return {
    map: finish(element),
    tile: 1.6,
    roughness: 0.14,
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
    rotation: 0,
  };
}

function travertine(): FloorFinish {
  const size = 1024;
  const { element, context } = canvas(size);
  const random = seededRandom(23);
  const base: Rgb = [216, 199, 170];
  const rows = 4;
  const rowHeight = size / rows;
  const tileWidth = size / 2;
  for (let row = 0; row < rows; row++) {
    const shift = row % 2 === 0 ? 0 : tileWidth / 2;
    for (let col = 0; col < 2; col++) {
      const x = col * tileWidth + shift;
      const y = row * rowHeight;
      const tone = 0.92 + random() * 0.12;
      // Banding and the open pores travertine is known for.
      const bands = Array.from({ length: 14 }, () => ({
        y: random() * rowHeight,
        h: 2 + random() * 8,
        tone: tone * (0.88 + random() * 0.2),
      }));
      const pores = Array.from({ length: 70 }, () => ({
        x: random() * tileWidth,
        y: random() * rowHeight,
        rx: 1 + random() * 5,
        ry: 0.6 + random() * 1.6,
        tone: 0.62 + random() * 0.2,
      }));
      wrapped(size, x, y, (px, py) => {
        context.fillStyle = shade(base, tone);
        context.fillRect(px, py, tileWidth, rowHeight);
        for (const band of bands) {
          context.fillStyle = shade(base, band.tone, 0.12);
          context.fillRect(px, py + band.y, tileWidth, band.h);
        }
        for (const pore of pores) {
          context.fillStyle = shade(base, pore.tone, 0.5);
          context.beginPath();
          context.ellipse(px + pore.x, py + pore.y, pore.rx, pore.ry, 0, 0, Math.PI * 2);
          context.fill();
        }
        context.strokeStyle = shade(base, 0.78, 0.9);
        context.lineWidth = 2;
        context.strokeRect(px + 1, py + 1, tileWidth - 2, rowHeight - 2);
      });
    }
  }
  return {
    map: finish(element),
    tile: 1.6,
    roughness: 0.62,
    clearcoat: 0.1,
    clearcoatRoughness: 0.6,
    rotation: 0,
  };
}

function microcement(): FloorFinish {
  const size = 512;
  const { element, context } = canvas(size);
  const image = context.createImageData(size, size);
  const cloud = fbm(41, 3, 6);
  const trowel = fbm(77, 8, 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const value = 0.86 + (cloud(u, v) - 0.5) * 0.16 + (trowel(u, v * 0.4) - 0.5) * 0.05;
      const i = (y * size + x) * 4;
      image.data[i] = 172 * value;
      image.data[i + 1] = 166 * value;
      image.data[i + 2] = 158 * value;
      image.data[i + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return {
    map: finish(element),
    tile: 2.4,
    roughness: 0.55,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
    rotation: 0,
  };
}

const floors: Record<FloorKind, () => FloorFinish> = {
  oak,
  "walnut-herringbone": herringbone,
  marble,
  travertine,
  microcement,
};

export function createFloorFinish(kind: FloorKind): FloorFinish {
  const floor = floors[kind]();
  floor.map.center.set(0.5, 0.5);
  floor.map.rotation = floor.rotation;
  return floor;
}

/** Faint trowelled-plaster variation; the paint colour multiplies it. */
export function createPlasterTexture() {
  const size = 256;
  const { element, context } = canvas(size);
  const image = context.createImageData(size, size);
  const noise = fbm(3, 4, 5);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = 232 + (noise(x / size, y / size) - 0.5) * 34;
      const i = (y * size + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return finish(element);
}

/** Cotton warp threads knotted off at the carpet's ends; transparent between strands. */
export function createFringeTexture() {
  const width = 512;
  const height = 64;
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  const context = element.getContext("2d");
  if (!context) throw new Error("2D canvas is not available");
  const random = seededRandom(61);
  for (let x = 0; x < width; x += 3) {
    const sway = (random() - 0.5) * 6;
    const length = height * (0.78 + random() * 0.22);
    const tone = 228 + Math.round(random() * 22);
    context.strokeStyle = `rgba(${tone}, ${tone - 8}, ${tone - 22}, 0.95)`;
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(x, 0);
    context.quadraticCurveTo(x + sway * 0.3, length * 0.5, x + sway, length);
    context.stroke();
  }
  // The knotted band where the warp leaves the weave.
  context.fillStyle = "rgba(222, 210, 188, 1)";
  context.fillRect(0, 0, width, 6);
  return finish(element);
}

/** Mean colour of a photo's outer band: the carpet's overcast edge, used for its sides. */
export function averageEdgeColor(image: CanvasImageSource): string {
  const size = 32;
  const { context } = canvas(size);
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x > 1 && x < size - 2 && y > 1 && y < size - 2) continue;
      const i = (y * size + x) * 4;
      r += data[i]!;
      g += data[i + 1]!;
      b += data[i + 2]!;
      n++;
    }
  }
  // Darkened: the side of the pile is in its own shadow.
  const f = (v: number) => Math.round((v / n) * 0.7);
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}
