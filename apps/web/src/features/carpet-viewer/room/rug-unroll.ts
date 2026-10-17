/**
 * A carpet laid out the way a dealer does it: a roll on the floor that unrolls along the carpet's
 * length. The roll is an Archimedean spiral whose layers are one pile-thickness apart, so its
 * radius shrinks as the floor takes up length. Free of React and three.js; the scene feeds the
 * positions straight into a BufferGeometry.
 */
export interface RugGrid {
  columns: number;
  rows: number;
  width: number;
  length: number;
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

const CORE_RADIUS = 0.035;
const MAX_ROWS = 220;

export function createRugGrid(width: number, length: number, columns = 24): RugGrid {
  // Rows about every 2 cm keep the tight inner turns of the roll round.
  const rows = Math.min(MAX_ROWS, Math.ceil(length / 0.02)) + 1;
  const cols = columns + 1;
  const positions = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);
  const indices = new Uint32Array(columns * (rows - 1) * 6);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      uvs[i * 2] = c / columns;
      // The top of the photo lies at the far (−z) end.
      uvs[i * 2 + 1] = 1 - r / (rows - 1);
    }
  }
  let k = 0;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < columns; c++) {
      const a = r * cols + c;
      const b = a + cols;
      indices.set([a, b, a + 1, b, b + 1, a + 1], k);
      k += 6;
    }
  }
  const grid = { columns: cols, rows, width, length, positions, uvs, indices };
  unrollRug(grid, 1, 0.01);
  return grid;
}

/** Writes the sheet for `progress` 0 (fully rolled at the far end) to 1 (flat). */
export function unrollRug(grid: RugGrid, progress: number, thickness: number) {
  const { columns, rows, width, length, positions } = grid;
  const p = Math.min(1, Math.max(0, progress));
  const front = -length / 2 + p * length;
  const remaining = length / 2 - front;
  const outer = Math.sqrt(CORE_RADIUS * CORE_RADIUS + (remaining * thickness) / Math.PI);
  for (let r = 0; r < rows; r++) {
    const z = -length / 2 + (r / (rows - 1)) * length;
    let pz = z;
    let py = 0;
    const s = z - front;
    if (s > 0 && remaining > 0) {
      const radius = Math.sqrt(
        Math.max(CORE_RADIUS * CORE_RADIUS, outer * outer - (s * thickness) / Math.PI),
      );
      const angle = ((2 * Math.PI) / thickness) * (outer - radius);
      pz = front + radius * Math.sin(angle);
      py = outer - radius * Math.cos(angle);
    }
    for (let c = 0; c < columns; c++) {
      const i = (r * columns + c) * 3;
      positions[i] = -width / 2 + (c / (columns - 1)) * width;
      positions[i + 1] = py;
      positions[i + 2] = pz;
    }
  }
}

/** Ease-out so the roll slows as it runs out, the way a heavy carpet does. */
export function unrollProgress(elapsed: number, duration: number) {
  const t = Math.min(1, Math.max(0, elapsed / duration));
  return 1 - (1 - t) ** 3;
}
