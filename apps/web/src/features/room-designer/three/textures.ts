import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

/** A small deterministic generator, so procedural surfaces look the same on every load. */
export function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable number from an item id, to seed its leaves or book spines. */
export function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

function canvas(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const element = document.createElement("canvas");
  element.width = size;
  element.height = size;
  const ctx = element.getContext("2d");
  if (ctx) draw(ctx, size);
  return element;
}

function repeating(texture: Texture, color: boolean) {
  if (color) texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

// Built once per page and shared by every piece: a room of twenty sofas still uploads each texture once.
let fabric: Texture | undefined;
let wood: Texture | undefined;
let herringbone: Texture | undefined;
let planks: Texture | undefined;
let tiles: Texture | undefined;
let concrete: Texture | undefined;
let contact: Texture | undefined;

/** Upholstery weave as a bump map: fine warp and weft with a little slub, no colour of its own. */
export function fabricBump() {
  fabric ??= repeating(
    new CanvasTexture(
      canvas(256, (ctx, size) => {
        const random = seeded(11);
        ctx.fillStyle = "#808080";
        ctx.fillRect(0, 0, size, size);
        const step = 4;
        for (let y = 0; y < size; y += step) {
          for (let x = 0; x < size; x += step) {
            const over = ((x + y) / step) % 2 === 0;
            const tone = (over ? 150 : 105) + random() * 30;
            ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
            ctx.fillRect(x, y, step, step);
          }
        }
      }),
    ),
    false,
  );
  return fabric;
}

/** Wood grain that averages near white, so the item's colour tints it without shifting it. */
export function woodGrain() {
  wood ??= repeating(
    new CanvasTexture(
      canvas(512, (ctx, size) => {
        const random = seeded(23);
        ctx.fillStyle = "rgb(238,238,238)";
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 90; i++) {
          const y = random() * size;
          ctx.strokeStyle = `rgba(0,0,0,${0.03 + random() * 0.07})`;
          ctx.lineWidth = 0.6 + random() * 1.8;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(
            size * 0.33,
            y + random() * 10 - 5,
            size * 0.66,
            y + random() * 10 - 5,
            size,
            y,
          );
          ctx.stroke();
        }
      }),
    ),
    true,
  );
  return wood;
}

function boards(
  draw: (ctx: CanvasRenderingContext2D, size: number, random: () => number) => void,
  seed: number,
) {
  return repeating(
    new CanvasTexture(canvas(1024, (ctx, size) => draw(ctx, size, seeded(seed)))),
    true,
  );
}

function grain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  random: () => number,
  vertical: boolean,
) {
  for (let g = 0; g < 6; g++) {
    ctx.strokeStyle = `rgba(0,0,0,${0.025 + random() * 0.04})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (vertical) {
      const gx = x + 3 + random() * (w - 6);
      ctx.moveTo(gx, y);
      ctx.lineTo(gx + random() * 3 - 1.5, y + h);
    } else {
      const gy = y + 3 + random() * (h - 6);
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy + random() * 3 - 1.5);
    }
    ctx.stroke();
  }
}

/** Straight planks: one texture repeat is one metre; six planks across, staggered seams. */
export function plankTexture() {
  planks ??= boards((ctx, size, random) => {
    const rows = 6;
    const h = size / rows;
    for (let r = 0; r < rows; r++) {
      let x = -random() * size * 0.6;
      while (x < size) {
        const w = size * (0.45 + random() * 0.5);
        const tone = Math.round(232 + random() * 22);
        ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
        ctx.fillRect(x, r * h, w, h);
        grain(ctx, x, r * h, w, h, random, false);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(x, r * h, 2, h);
        x += w;
      }
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(0, r * h + h - 2, size, 2);
    }
  }, 7);
  return planks;
}

/**
 * Herringbone parquet of 2:1 blocks. The blocks sit on the lattice spanned by (1, 1) and (2, −2) cells,
 * which repeats every four cells along both axes, so the texture tiles without a seam.
 */
export function herringboneTexture() {
  herringbone ??= boards((ctx, size, random) => {
    const u = size / 16;
    const block = (cx: number, cy: number, w: number, h: number, vertical: boolean) => {
      const tone = Math.round(226 + random() * 26);
      ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.fillRect(cx * u, cy * u, w * u, h * u);
      grain(ctx, cx * u, cy * u, w * u, h * u, random, vertical);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx * u, cy * u, w * u, h * u);
    };
    for (let n = -20; n < 40; n++) {
      for (let m = -20; m < 20; m++) {
        const x = n + 2 * m;
        const y = n - 2 * m;
        if (x < -4 || x > 18 || y < -4 || y > 18) continue;
        block(x, y, 2, 1, false);
        block(x + 2, y - 1, 1, 2, true);
      }
    }
  }, 9);
  return herringbone;
}

/** 60 cm stone tiles with a thin grout line; one repeat is 1.2 m. */
export function tileTexture() {
  tiles ??= boards((ctx, size, random) => {
    const n = 2;
    const t = size / n;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const tone = Math.round(236 + random() * 14);
        ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
        ctx.fillRect(c * t, r * t, t, t);
        for (let k = 0; k < 220; k++) {
          ctx.fillStyle = `rgba(0,0,0,${random() * 0.035})`;
          ctx.fillRect(
            c * t + random() * t,
            r * t + random() * t,
            3 + random() * 10,
            1 + random() * 3,
          );
        }
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillRect(c * t, r * t, t, 3);
        ctx.fillRect(c * t, r * t, 3, t);
      }
    }
  }, 13);
  return tiles;
}

/** Polished concrete: soft cloudy variation, no joints. */
export function concreteTexture() {
  concrete ??= boards((ctx, size, random) => {
    ctx.fillStyle = "rgb(238,238,238)";
    ctx.fillRect(0, 0, size, size);
    for (let k = 0; k < 900; k++) {
      const r = 8 + random() * 60;
      ctx.fillStyle = `rgba(0,0,0,${random() * 0.018})`;
      ctx.beginPath();
      ctx.arc(random() * size, random() * size, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 17);
  return concrete;
}

/** A soft dark disc that grounds a piece on the floor where the shadow map is too coarse to. */
export function contactShadow() {
  contact ??= new CanvasTexture(
    canvas(128, (ctx, size) => {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(0,0,0,0.55)");
      g.addColorStop(0.55, "rgba(0,0,0,0.25)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }),
  );
  return contact;
}
