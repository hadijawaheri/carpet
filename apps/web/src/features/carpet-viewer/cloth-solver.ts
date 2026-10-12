import type { ClothPhysics } from "@farsh/contracts";

const STRUCTURAL = 0;
const SHEAR = 1;
const BEND = 2;

/** On the floor the solver works in metres, so gravity is the real one. */
const FLOOR_GRAVITY = 9.8;
/** Share of sideways movement a sliding particle keeps per step: the pile drags on the boards, and on itself. */
const FLOOR_GRIP = 0.55;
/**
 * Below this much sideways movement in one step (metres) a particle in contact does not move at all.
 * Static friction is what lets a folded corner stay folded instead of springing back.
 */
const STATIC_FRICTION = 0.0016;
const FLOOR_CONTACT = 1e-3;
/** Bend links are this much weaker on the floor: a rug's own weight keeps a fold that would spring open in the air. */
const FLOOR_BEND = 0.12;
/** Triangles within this many rows and columns of a particle are its own neighbourhood, not another layer. */
const SELF_REACH = 3;
const SLEEP_AFTER = 45;
const SLEEP_MOTION = 1e-9;

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

  /** When true the top row stays on its rest points, like a carpet hung from a gallery rod. */
  private hanging = false;

  /** When true the sheet lies on a floor at z = 0: gravity pulls it down and nothing passes through. */
  private floor = false;
  /** Pile thickness on the floor: how far one layer of a fold rests above the one beneath. */
  private thickness = 0.01;
  /** Particles touching the floor or another layer this step; they get friction. */
  private readonly contact: Uint8Array;
  private readonly restArea: number;
  private cellStart = new Int32Array(0);
  private cellEntries = new Int32Array(0);
  /** Each triangle's footprint in grid cells (x0, x1, y0, y1), reused between the count and fill passes. */
  private readonly triSpan: Int16Array;
  /** Steps in a row the floor sheet has not moved; past a threshold it sleeps until touched. */
  private stillSteps = 0;

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
    this.contact = new Uint8Array(count);
    this.restArea = ((width / (this.cols - 1)) * (height / (this.rows - 1))) / 2;

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
    this.triSpan = new Int16Array((this.indices.length / 3) * 4);
  }

  /** A rug lying still costs nothing: stepping stops until a grab, a kick or a flatten wakes it. */
  get isAsleep() {
    return this.floor && this.grabbed < 0 && this.stillSteps > SLEEP_AFTER;
  }

  private wake() {
    this.stillSteps = 0;
  }

  setHanging(hanging: boolean) {
    this.hanging = hanging;
  }

  setFloor(floor: boolean, thickness = this.thickness) {
    this.floor = floor;
    this.thickness = thickness;
    this.wake();
  }

  /** Lays the sheet back flat on its rest pose, still. */
  flatten() {
    this.positions.set(this.rest);
    this.previous.set(this.rest);
    this.wake();
  }

  /** Highest point of the sheet above its rest plane; a folded or lifted rug is above zero. */
  get maxLift() {
    let max = 0;
    for (let i = 2; i < this.positions.length; i += 3) max = Math.max(max, this.positions[i]!);
    return max;
  }

  get isGrabbing() {
    return this.grabbed >= 0;
  }

  /** Holds the particle nearest to a local-space point; later steps pin it to the target. */
  grabNearest(x: number, y: number, z: number) {
    this.wake();
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
    this.wake();
    for (let i = 0; i < this.particleCount; i++) {
      const x = this.rest[i * 3]!;
      const y = this.rest[i * 3 + 1]!;
      this.previous[i * 3 + 2] =
        this.positions[i * 3 + 2]! - strength * Math.sin(y * 2.4 + x * 0.8);
    }
  }

  step(dt: number, time: number, physics: ClothPhysics, windEnabled = true) {
    if (this.isAsleep) return;
    const pos = this.positions;
    const prev = this.previous;
    const rest = this.rest;
    const dt2 = dt * dt;
    const windAmp = windEnabled && !this.floor ? physics.wind * 2.2 : 0;
    const gravity = this.floor ? -FLOOR_GRAVITY * dt2 : 0;

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
      pos[i3 + 2] = z + (z - prev[i3 + 2]!) * physics.damping + wind * dt2 + gravity;
      prev[i3] = x;
      prev[i3 + 1] = y;
      prev[i3 + 2] = z;
      // On the floor nothing pulls the rug back: where a visitor leaves it, folded or askew, it stays.
      if (this.floor) continue;
      pos[i3] = pos[i3]! + (rx - pos[i3]!) * physics.restore;
      pos[i3 + 1] = pos[i3 + 1]! + (ry - pos[i3 + 1]!) * physics.restore;
      pos[i3 + 2] = pos[i3 + 2]! - pos[i3 + 2]! * physics.restore;
    }

    const bend = this.floor
      ? Math.min(physics.bendStiffness, 0.2) * FLOOR_BEND
      : physics.bendStiffness;
    const stiffness = [1, physics.shearStiffness, bend];
    const g = this.grabbed;
    for (let it = 0; it < physics.iterations; it++) {
      this.pinTopRow();
      this.pinGrabbed();
      for (let k = 0; k < this.linkLength.length; k++) {
        const a = this.linkA[k]!;
        const b = this.linkB[k]!;
        const wa = a === g || this.isPinned(a) ? 0 : 1;
        const wb = b === g || this.isPinned(b) ? 0 : 1;
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
    this.pinTopRow();
    this.pinGrabbed();
    if (this.floor) {
      this.contact.fill(0);
      // A flat rug cannot overlap itself; the layer test is only needed once something is lifted.
      if (this.grabbed >= 0 || this.maxLift > this.thickness * 0.5) this.collideLayers();
      this.settleOnFloor();
      this.applyFriction();
      let motion = 0;
      for (let i = 0; i < pos.length; i++) motion = Math.max(motion, Math.abs(pos[i]! - prev[i]!));
      this.stillSteps = motion * motion < SLEEP_MOTION ? this.stillSteps + 1 : 0;
    }
  }

  /** Floor contact: nothing sinks below z = 0. */
  private settleOnFloor() {
    const pos = this.positions;
    const prev = this.previous;
    for (let i = 0; i < this.particleCount; i++) {
      if (i === this.grabbed) continue;
      const i3 = i * 3;
      if (pos[i3 + 2]! > FLOOR_CONTACT) continue;
      pos[i3 + 2] = 0;
      if (prev[i3 + 2]! < 0) prev[i3 + 2] = 0;
      this.contact[i] = 1;
    }
  }

  /** Static then sliding friction for every particle resting on the floor or on another layer of the rug. */
  private applyFriction() {
    const pos = this.positions;
    const prev = this.previous;
    for (let i = 0; i < this.particleCount; i++) {
      if (!this.contact[i] || i === this.grabbed) continue;
      const i3 = i * 3;
      const dx = pos[i3]! - prev[i3]!;
      const dy = pos[i3 + 1]! - prev[i3 + 1]!;
      if (dx * dx + dy * dy < STATIC_FRICTION * STATIC_FRICTION) {
        pos[i3] = prev[i3]!;
        pos[i3 + 1] = prev[i3 + 1]!;
      } else {
        prev[i3] = pos[i3]! - dx * FLOOR_GRIP;
        prev[i3 + 1] = pos[i3 + 1]! - dy * FLOOR_GRIP;
      }
    }
  }

  /**
   * Keeps the rug from passing through itself when a corner is folded over, seen from above: each
   * particle is tested against the triangles beneath or above it (far enough along the weave not to be
   * its own neighbours) and held one pile thickness away, on the side it came from. A uniform grid over
   * the sheet's current footprint keeps this linear in the particle count.
   */
  private collideLayers() {
    const pos = this.positions;
    const prev = this.previous;
    const cols = this.cols;
    const triCount = this.indices.length / 3;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < pos.length; i += 3) {
      minX = Math.min(minX, pos[i]!);
      maxX = Math.max(maxX, pos[i]!);
      minY = Math.min(minY, pos[i + 1]!);
      maxY = Math.max(maxY, pos[i + 1]!);
    }
    const cell = Math.sqrt(this.restArea * 2) * 1.5;
    const gx = Math.max(1, Math.min(256, Math.ceil((maxX - minX) / cell) + 1));
    const gy = Math.max(1, Math.min(256, Math.ceil((maxY - minY) / cell) + 1));
    const cellCount = gx * gy;
    if (this.cellStart.length < cellCount + 1) this.cellStart = new Int32Array(cellCount + 1);
    const start = this.cellStart;
    start.fill(0, 0, cellCount + 1);
    const cx = (x: number) => Math.min(gx - 1, Math.max(0, Math.floor((x - minX) / cell)));
    const cy = (y: number) => Math.min(gy - 1, Math.max(0, Math.floor((y - minY) / cell)));

    // Counting sort of triangles into every cell their footprint touches: count, prefix-sum, fill.
    const spans = this.triSpan;
    let total = 0;
    for (let t = 0; t < triCount; t++) {
      const a = this.indices[t * 3]! * 3;
      const b = this.indices[t * 3 + 1]! * 3;
      const c = this.indices[t * 3 + 2]! * 3;
      const x0 = cx(Math.min(pos[a]!, pos[b]!, pos[c]!));
      const x1 = cx(Math.max(pos[a]!, pos[b]!, pos[c]!));
      const y0 = cy(Math.min(pos[a + 1]!, pos[b + 1]!, pos[c + 1]!));
      const y1 = cy(Math.max(pos[a + 1]!, pos[b + 1]!, pos[c + 1]!));
      spans[t * 4] = x0;
      spans[t * 4 + 1] = x1;
      spans[t * 4 + 2] = y0;
      spans[t * 4 + 3] = y1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) start[y * gx + x + 1]!++;
      total += (x1 - x0 + 1) * (y1 - y0 + 1);
    }
    for (let k = 1; k <= cellCount; k++) start[k] = start[k]! + start[k - 1]!;
    if (this.cellEntries.length < total) this.cellEntries = new Int32Array(total * 2);
    const entries = this.cellEntries;
    const fill = start.slice(0, cellCount);
    for (let t = 0; t < triCount; t++) {
      const x0 = spans[t * 4]!;
      const x1 = spans[t * 4 + 1]!;
      const y0 = spans[t * 4 + 2]!;
      const y1 = spans[t * 4 + 3]!;
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) entries[fill[y * gx + x]!++] = t;
    }

    const thick = this.thickness;
    for (let i = 0; i < this.particleCount; i++) {
      if (i === this.grabbed) continue;
      const i3 = i * 3;
      const px = pos[i3]!;
      const py = pos[i3 + 1]!;
      const ri = Math.floor(i / cols);
      const ci = i % cols;
      const k = cy(py) * gx + cx(px);
      for (let e = start[k]!; e < start[k + 1]!; e++) {
        const t = entries[e]!;
        const ia = this.indices[t * 3]!;
        const rt = Math.floor(ia / cols);
        const ct = ia % cols;
        if (Math.abs(rt - ri) <= SELF_REACH && Math.abs(ct - ci) <= SELF_REACH) continue;
        const a = ia * 3;
        const b = this.indices[t * 3 + 1]! * 3;
        const c = this.indices[t * 3 + 2]! * 3;
        // Barycentric coordinates of the particle in the triangle's footprint.
        const v0x = pos[b]! - pos[a]!;
        const v0y = pos[b + 1]! - pos[a + 1]!;
        const v1x = pos[c]! - pos[a]!;
        const v1y = pos[c + 1]! - pos[a + 1]!;
        const den = v0x * v1y - v1x * v0y;
        // A triangle standing on edge (the crease of a fold) has no footprint to rest on.
        if (Math.abs(den) < this.restArea * 0.4) continue;
        const wx = px - pos[a]!;
        const wy = py - pos[a + 1]!;
        const u = (wx * v1y - v1x * wy) / den;
        const v = (v0x * wy - wx * v0y) / den;
        if (u < -0.02 || v < -0.02 || u + v > 1.02) continue;
        const w = 1 - u - v;
        const zt = w * pos[a + 2]! + u * pos[b + 2]! + v * pos[c + 2]!;
        const zPrev = w * prev[a + 2]! + u * prev[b + 2]! + v * prev[c + 2]!;
        const above = prev[i3 + 2]! >= zPrev;
        const z = pos[i3 + 2]!;
        if (above && z < zt + thick) {
          pos[i3 + 2] = zt + thick;
          this.contact[i] = 1;
        } else if (!above && z > zt - thick) {
          pos[i3 + 2] = Math.max(0, zt - thick);
          this.contact[i] = 1;
        }
      }
    }
  }

  private isPinned(i: number) {
    return this.hanging && i < this.cols;
  }

  private pinTopRow() {
    if (!this.hanging) return;
    for (let c = 0; c < this.cols; c++) {
      const c3 = c * 3;
      this.positions[c3] = this.rest[c3]!;
      this.positions[c3 + 1] = this.rest[c3 + 1]!;
      this.positions[c3 + 2] = this.rest[c3 + 2]!;
      this.previous[c3] = this.rest[c3]!;
      this.previous[c3 + 1] = this.rest[c3 + 1]!;
      this.previous[c3 + 2] = this.rest[c3 + 2]!;
    }
  }

  private pinGrabbed() {
    if (this.grabbed < 0) return;
    const g3 = this.grabbed * 3;
    this.positions[g3] = this.target.x;
    this.positions[g3 + 1] = this.target.y;
    this.positions[g3 + 2] = this.target.z;
  }
}
