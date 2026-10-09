import type { ClothPhysics } from "@farsh/contracts";

const STRUCTURAL = 0;
const SHEAR = 1;
const BEND = 2;

/**
 * Verlet cloth on a cols × rows grid in the carpet's local XY plane; z is the carpet normal.
 * Kept free of React and three.js so it can be unit-tested and moved to a Web Worker later.
 */
export class ClothSolver {
  readonly cols: number;
  readonly rows: number;
  readonly positions: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint32Array;

  private readonly previous: Float32Array;
  private readonly rest: Float32Array;
  private readonly linkA: Int32Array;
  private readonly linkB: Int32Array;
  private readonly linkKind: Uint8Array;
  private readonly linkLength: Float32Array;

  /** Index of the particle held by the pointer, or -1. */
  private grabbed = -1;
  private readonly target = { x: 0, y: 0, z: 0 };

  constructor(width: number, height: number, cols: number) {
    this.cols = cols;
    this.rows = Math.max(8, Math.round((cols * height) / width));
    const count = this.cols * this.rows;
    this.positions = new Float32Array(count * 3);
    this.previous = new Float32Array(count * 3);
    this.rest = new Float32Array(count * 3);
    this.uvs = new Float32Array(count * 2);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        this.rest[i * 3] = (c / (this.cols - 1) - 0.5) * width;
        this.rest[i * 3 + 1] = (0.5 - r / (this.rows - 1)) * height;
        this.uvs[i * 2] = c / (this.cols - 1);
        this.uvs[i * 2 + 1] = 1 - r / (this.rows - 1);
      }
    }
    this.positions.set(this.rest);
    this.previous.set(this.rest);

    const a: number[] = [];
    const b: number[] = [];
    const kind: number[] = [];
    const link = (r1: number, c1: number, r2: number, c2: number, k: number) => {
      if (r2 < 0 || r2 >= this.rows || c2 < 0 || c2 >= this.cols) return;
      a.push(r1 * this.cols + c1);
      b.push(r2 * this.cols + c2);
      kind.push(k);
    };
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        link(r, c, r, c + 1, STRUCTURAL);
        link(r, c, r + 1, c, STRUCTURAL);
        link(r, c, r + 1, c + 1, SHEAR);
        link(r, c + 1, r + 1, c, SHEAR);
        link(r, c, r, c + 2, BEND);
        link(r, c, r + 2, c, BEND);
      }
    }
    this.linkA = Int32Array.from(a);
    this.linkB = Int32Array.from(b);
    this.linkKind = Uint8Array.from(kind);
    this.linkLength = new Float32Array(a.length);
    for (let k = 0; k < a.length; k++) {
      const p = this.linkA[k]! * 3;
      const q = this.linkB[k]! * 3;
      this.linkLength[k] = Math.hypot(
        this.rest[q]! - this.rest[p]!,
        this.rest[q + 1]! - this.rest[p + 1]!,
      );
    }

    const tris: number[] = [];
    for (let r = 0; r < this.rows - 1; r++) {
      for (let c = 0; c < this.cols - 1; c++) {
        const i = r * this.cols + c;
        tris.push(i, i + this.cols, i + 1, i + 1, i + this.cols, i + this.cols + 1);
      }
    }
    this.indices = Uint32Array.from(tris);
  }

  get isGrabbing() {
    return this.grabbed >= 0;
  }

  /** Holds the particle nearest to a local-space point; later steps pin it to the target. */
  grabNearest(x: number, y: number, z: number) {
    this.grabbed = this.nearestParticle(x, y, z);
    this.moveTarget(x, y, z);
  }

  moveTarget(x: number, y: number, z: number) {
    this.target.x = x;
    this.target.y = y;
    this.target.z = z;
  }

  release() {
    this.grabbed = -1;
  }

  get particleCount() {
    return this.cols * this.rows;
  }

  nearestParticle(x: number, y: number, z: number) {
    let best = -1;
    let bestDistance = Infinity;
    const p = this.positions;
    for (let i = 0; i < this.particleCount; i++) {
      const d = (p[i * 3]! - x) ** 2 + (p[i * 3 + 1]! - y) ** 2 + (p[i * 3 + 2]! - z) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    return best;
  }

  /** Kicks the sheet along its normal so a change of carpet or material is felt, not just seen. */
  impulse(strength: number) {
    for (let i = 0; i < this.particleCount; i++) {
      const x = this.rest[i * 3]!;
      const y = this.rest[i * 3 + 1]!;
      this.previous[i * 3 + 2] =
        this.positions[i * 3 + 2]! - strength * Math.sin(y * 2.4 + x * 0.8);
    }
  }

  step(dt: number, time: number, physics: ClothPhysics, windEnabled = true) {
    const pos = this.positions;
    const prev = this.previous;
    const rest = this.rest;
    const dt2 = dt * dt;
    const windAmp = windEnabled ? physics.wind * 2.2 : 0;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const x = pos[i3]!;
      const y = pos[i3 + 1]!;
      const z = pos[i3 + 2]!;
      const rx = rest[i3]!;
      const ry = rest[i3 + 1]!;
      const wind =
        windAmp *
        (0.55 * Math.sin(rx * 1.7 + time * 1.9) + 0.8 * Math.sin(ry * 1.2 - time * 1.4 + rx * 0.6));
      pos[i3] = x + (x - prev[i3]!) * physics.damping;
      pos[i3 + 1] = y + (y - prev[i3 + 1]!) * physics.damping;
      pos[i3 + 2] = z + (z - prev[i3 + 2]!) * physics.damping + wind * dt2;
      prev[i3] = x;
      prev[i3 + 1] = y;
      prev[i3 + 2] = z;
      pos[i3] = pos[i3]! + (rx - pos[i3]!) * physics.restore;
      pos[i3 + 1] = pos[i3 + 1]! + (ry - pos[i3 + 1]!) * physics.restore;
      pos[i3 + 2] = pos[i3 + 2]! - pos[i3 + 2]! * physics.restore;
    }

    const stiffness = [1, physics.shearStiffness, physics.bendStiffness];
    const g = this.grabbed;
    for (let it = 0; it < physics.iterations; it++) {
      this.pinGrabbed();
      for (let k = 0; k < this.linkLength.length; k++) {
        const a = this.linkA[k]!;
        const b = this.linkB[k]!;
        const wa = a === g ? 0 : 1;
        const wb = b === g ? 0 : 1;
        if (wa + wb === 0) continue;
        const a3 = a * 3;
        const b3 = b * 3;
        const dx = pos[b3]! - pos[a3]!;
        const dy = pos[b3 + 1]! - pos[a3 + 1]!;
        const dz = pos[b3 + 2]! - pos[a3 + 2]!;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const corr = (((d - this.linkLength[k]!) / d) * stiffness[this.linkKind[k]!]!) / (wa + wb);
        pos[a3] = pos[a3]! + dx * corr * wa;
        pos[a3 + 1] = pos[a3 + 1]! + dy * corr * wa;
        pos[a3 + 2] = pos[a3 + 2]! + dz * corr * wa;
        pos[b3] = pos[b3]! - dx * corr * wb;
        pos[b3 + 1] = pos[b3 + 1]! - dy * corr * wb;
        pos[b3 + 2] = pos[b3 + 2]! - dz * corr * wb;
      }
    }
    this.pinGrabbed();
  }

  private pinGrabbed() {
    if (this.grabbed < 0) return;
    const g3 = this.grabbed * 3;
    this.positions[g3] = this.target.x;
    this.positions[g3 + 1] = this.target.y;
    this.positions[g3 + 2] = this.target.z;
  }
}
