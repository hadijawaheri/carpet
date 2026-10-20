import type { RoomDimensions, RoomType } from "./room-config";

export type FurnitureKind =
  | "sofa"
  | "armchair"
  | "coffee-table"
  | "side-table"
  | "floor-lamp"
  | "plant"
  | "sideboard"
  | "bookshelf"
  | "wall-art"
  | "bed"
  | "nightstand"
  | "bench"
  | "dining-table"
  | "dining-chair"
  | "desk"
  | "office-chair"
  | "chandelier"
  | "pendant";

/** Footprint in metres (width along the item's own x, depth along its own z, height). */
export const furnitureSize: Record<
  FurnitureKind,
  { width: number; depth: number; height: number }
> = {
  sofa: { width: 2.3, depth: 0.95, height: 0.82 },
  armchair: { width: 0.82, depth: 0.85, height: 0.8 },
  "coffee-table": { width: 1.2, depth: 0.65, height: 0.4 },
  "side-table": { width: 0.45, depth: 0.45, height: 0.55 },
  "floor-lamp": { width: 0.4, depth: 0.4, height: 1.6 },
  plant: { width: 0.55, depth: 0.55, height: 1.5 },
  sideboard: { width: 1.8, depth: 0.45, height: 0.8 },
  bookshelf: { width: 1.6, depth: 0.36, height: 2.1 },
  "wall-art": { width: 1.2, depth: 0.04, height: 0.85 },
  bed: { width: 1.8, depth: 2.12, height: 1.15 },
  nightstand: { width: 0.5, depth: 0.42, height: 0.55 },
  bench: { width: 1.3, depth: 0.42, height: 0.46 },
  "dining-table": { width: 1.0, depth: 2.0, height: 0.76 },
  "dining-chair": { width: 0.48, depth: 0.52, height: 0.9 },
  desk: { width: 1.6, depth: 0.78, height: 0.76 },
  "office-chair": { width: 0.66, depth: 0.66, height: 1.1 },
  chandelier: { width: 0.9, depth: 0.9, height: 0.8 },
  pendant: { width: 0.45, depth: 0.45, height: 0.5 },
};

/** Items that hang or sit on walls; they never cover a carpet's footprint. */
export const raisedKinds: ReadonlySet<FurnitureKind> = new Set([
  "wall-art",
  "chandelier",
  "pendant",
]);

export interface FurnitureItem {
  kind: FurnitureKind;
  x: number;
  z: number;
  /** Turn about y; at 0 the item faces +z (into the room from the back wall). */
  rotation: number;
  width?: number;
  depth?: number;
  /** Height of the item's centre (wall art) or its hanging point (lights). */
  y?: number;
}

export interface WindowOpening {
  /** Centre along the left wall (z). */
  z: number;
  width: number;
  sill: number;
  top: number;
}

export interface RoomLayout {
  furniture: FurnitureItem[];
  windows: WindowOpening[];
  /** Where a carpet naturally goes in this room, and whether its long side runs along x. */
  rug: { x: number; z: number; quarterTurns: 0 | 1 };
  crownMoulding: boolean;
}

const HALF_PI = Math.PI / 2;

/** Lays furniture out against real wall distances so it keeps believable clearances at any size. */
export function layoutRoom(type: RoomType, room: RoomDimensions): RoomLayout {
  switch (type) {
    case "living":
      return living(room);
    case "salon":
      return salon(room);
    case "bedroom":
      return bedroom(room);
    case "dining":
      return dining(room);
    case "office":
      return office(room);
  }
}

function living({ width, length, height }: RoomDimensions): RoomLayout {
  const back = -length / 2;
  const sofaWidth = Math.min(2.4, width - 1.7);
  const sofaZ = back + furnitureSize.sofa.depth / 2 + 0.06;
  const tableZ =
    sofaZ + furnitureSize.sofa.depth / 2 + 0.45 + furnitureSize["coffee-table"].depth / 2;
  const chairZ = Math.min(tableZ + 1.15, length / 2 - 0.6);
  const sideX = sofaWidth / 2 + 0.32;
  return {
    furniture: arrange(
      [
        { kind: "sofa", x: 0, z: sofaZ, rotation: 0, width: sofaWidth },
        { kind: "coffee-table", x: 0, z: tableZ, rotation: 0 },
        {
          kind: "wall-art",
          x: 0,
          z: back + 0.02,
          rotation: 0,
          y: 1.6,
          width: Math.min(1.4, sofaWidth * 0.6),
        },
      ],
      [
        { kind: "armchair", x: -0.78, z: chairZ, rotation: Math.PI - 0.32 },
        { kind: "armchair", x: 0.78, z: chairZ, rotation: Math.PI + 0.32 },
        { kind: "side-table", x: sideX, z: back + 0.3, rotation: 0 },
        { kind: "floor-lamp", x: -sideX, z: back + 0.28, rotation: 0 },
        { kind: "plant", x: -width / 2 + 0.4, z: length / 2 - 0.45, rotation: 0.4 },
        { kind: "plant", x: width / 2 - 0.38, z: back + 0.38, rotation: 0.4 },
        {
          kind: "sideboard",
          x: width / 2 - furnitureSize.sideboard.depth / 2 - 0.02,
          z: Math.min(tableZ + 0.4, length / 2 - 1.1),
          rotation: -HALF_PI,
          width: Math.min(1.8, length - 2.6),
        },
      ],
    ),
    windows: [
      { z: -length * 0.08, width: Math.min(2.2, length * 0.4), sill: 0.55, top: height - 0.4 },
    ],
    rug: { x: 0, z: (sofaZ + chairZ) / 2 + 0.05, quarterTurns: 1 },
    crownMoulding: false,
  };
}

function salon({ width, length, height }: RoomDimensions): RoomLayout {
  const back = -length / 2;
  const sofaWidth = Math.min(2.7, width - 2.6);
  const sofaZ = back + furnitureSize.sofa.depth / 2 + 0.06;
  const tableZ =
    sofaZ + furnitureSize.sofa.depth / 2 + 0.5 + furnitureSize["coffee-table"].depth / 2;
  const sideChairX = sofaWidth / 2 + 0.7;
  const seatingCentreZ = tableZ + 0.15;
  const facingZ = Math.min(tableZ + 1.25, -0.4);
  const diningZ = Math.max(facingZ + 2.3, length * 0.22);
  const diningLength = Math.min(2.6, length / 2 - 1.6);
  const chairOffsets = [-0.78, 0, 0.78].filter((o) => Math.abs(o) < diningLength / 2);
  return {
    furniture: arrange(
      [
        { kind: "sofa", x: 0, z: sofaZ, rotation: 0, width: sofaWidth },
        { kind: "coffee-table", x: 0, z: tableZ, rotation: 0, width: 1.4, depth: 0.75 },
        { kind: "armchair", x: -sideChairX, z: seatingCentreZ, rotation: HALF_PI },
        { kind: "armchair", x: sideChairX, z: seatingCentreZ, rotation: -HALF_PI },
        { kind: "armchair", x: -0.55, z: facingZ, rotation: Math.PI },
        { kind: "armchair", x: 0.55, z: facingZ, rotation: Math.PI },
        { kind: "wall-art", x: 0, z: back + 0.02, rotation: 0, y: 1.85, width: 1.8 },
        { kind: "chandelier", x: 0, z: tableZ, rotation: 0, y: height },
        { kind: "dining-table", x: 0, z: diningZ, rotation: 0, depth: diningLength, width: 1.1 },
        ...chairOffsets.flatMap((offset) => [
          { kind: "dining-chair" as const, x: -0.82, z: diningZ + offset, rotation: HALF_PI },
          { kind: "dining-chair" as const, x: 0.82, z: diningZ + offset, rotation: -HALF_PI },
        ]),
        { kind: "dining-chair", x: 0, z: diningZ - diningLength / 2 - 0.4, rotation: 0 },
        { kind: "dining-chair", x: 0, z: diningZ + diningLength / 2 + 0.4, rotation: Math.PI },
        {
          kind: "wall-art",
          x: width / 2 - 0.02,
          z: diningZ,
          rotation: -HALF_PI,
          y: 1.75,
          width: 1.3,
        },
        { kind: "chandelier", x: 0, z: diningZ, rotation: 0, y: height },
      ],
      [
        {
          kind: "sideboard",
          x: width / 2 - furnitureSize.sideboard.depth / 2 - 0.02,
          z: diningZ,
          rotation: -HALF_PI,
          width: 2.2,
        },
        { kind: "side-table", x: sofaWidth / 2 + 0.35, z: back + 0.3, rotation: 0 },
        { kind: "side-table", x: -sofaWidth / 2 - 0.35, z: back + 0.3, rotation: 0 },
        { kind: "floor-lamp", x: width / 2 - 0.35, z: facingZ, rotation: 0 },
        { kind: "plant", x: width / 2 - 0.45, z: back + 0.45, rotation: 0 },
        { kind: "plant", x: -width / 2 + 0.45, z: back + 0.45, rotation: 1.2 },
        { kind: "plant", x: -width / 2 + 0.45, z: length / 2 - 0.5, rotation: 2.4 },
      ],
    ),
    windows: [
      { z: -length * 0.24, width: 1.7, sill: 0.12, top: height - 0.45 },
      { z: length * 0.22, width: 1.7, sill: 0.12, top: height - 0.45 },
    ],
    rug: { x: 0, z: (sofaZ + facingZ) / 2, quarterTurns: 1 },
    crownMoulding: true,
  };
}

function bedroom({ width, length, height }: RoomDimensions): RoomLayout {
  const back = -length / 2;
  const bedWidth = Math.min(1.8, width - 1.5);
  const bedZ = back + furnitureSize.bed.depth / 2 + 0.04;
  const standX = bedWidth / 2 + 0.33;
  return {
    furniture: arrange(
      [
        { kind: "bed", x: 0, z: bedZ, rotation: 0, width: bedWidth },
        { kind: "nightstand", x: -standX, z: back + 0.25, rotation: 0 },
        { kind: "nightstand", x: standX, z: back + 0.25, rotation: 0 },
        {
          kind: "bench",
          x: 0,
          z: Math.min(bedZ + furnitureSize.bed.depth / 2 + 0.3, length / 2 - 0.5),
          rotation: 0,
          width: Math.min(1.3, bedWidth - 0.2),
        },
        {
          kind: "wall-art",
          x: 0,
          z: back + 0.02,
          rotation: 0,
          y: 1.75,
          width: Math.min(1.2, bedWidth),
        },
        { kind: "pendant", x: 0, z: bedZ + 0.5, rotation: 0, y: height - 0.6 },
      ],
      [
        // A low dresser rather than a wardrobe: a tall cabinet on this wall would hide the room.
        {
          kind: "sideboard",
          x: width / 2 - furnitureSize.sideboard.depth / 2 - 0.02,
          z: bedZ + 0.5,
          rotation: -HALF_PI,
          width: 1.3,
        },
        { kind: "plant", x: -width / 2 + 0.4, z: length / 2 - 0.5, rotation: 0.8 },
      ],
    ),
    windows: [
      { z: length * 0.12, width: Math.min(1.6, length * 0.36), sill: 0.75, top: height - 0.4 },
    ],
    // A bed rug runs across the bed, under its lower two-thirds, so both sides land on wool.
    rug: { x: 0, z: bedZ + 0.4, quarterTurns: 1 },
    crownMoulding: false,
  };
}

function dining({ width, length, height }: RoomDimensions): RoomLayout {
  const back = -length / 2;
  const tableLength = Math.min(2.0, length - 2.8);
  const tableZ = 0.25;
  const offsets = tableLength >= 1.8 ? [-0.58, 0, 0.58] : [-0.4, 0.4];
  return {
    furniture: arrange(
      [
        { kind: "dining-table", x: 0, z: tableZ, rotation: 0, depth: tableLength },
        ...offsets.flatMap((offset) => [
          { kind: "dining-chair" as const, x: -0.78, z: tableZ + offset, rotation: HALF_PI },
          { kind: "dining-chair" as const, x: 0.78, z: tableZ + offset, rotation: -HALF_PI },
        ]),
        { kind: "dining-chair", x: 0, z: tableZ - tableLength / 2 - 0.36, rotation: 0 },
        { kind: "dining-chair", x: 0, z: tableZ + tableLength / 2 + 0.36, rotation: Math.PI },
        { kind: "wall-art", x: 0, z: back + 0.02, rotation: 0, y: 1.65, width: 1.3 },
        { kind: "pendant", x: 0, z: tableZ - 0.45, rotation: 0, y: height - 1.1 },
        { kind: "pendant", x: 0, z: tableZ + 0.45, rotation: 0, y: height - 1.1 },
      ],
      [
        {
          kind: "sideboard",
          x: 0,
          z: back + furnitureSize.sideboard.depth / 2 + 0.02,
          rotation: 0,
        },
        { kind: "plant", x: width / 2 - 0.4, z: back + 0.4, rotation: 0 },
        { kind: "plant", x: -width / 2 + 0.4, z: back + 0.4, rotation: 1 },
      ],
    ),
    windows: [{ z: tableZ, width: Math.min(2, length * 0.4), sill: 0.6, top: height - 0.4 }],
    // A dining rug runs with the table and leaves pulled-out chairs on it.
    rug: { x: 0, z: tableZ, quarterTurns: 0 },
    crownMoulding: false,
  };
}

function office({ width, length, height }: RoomDimensions): RoomLayout {
  const back = -length / 2;
  const deskZ = back + 1.45;
  return {
    furniture: arrange(
      [
        {
          kind: "bookshelf",
          x: 0,
          z: back + furnitureSize.bookshelf.depth / 2 + 0.02,
          rotation: 0,
          width: Math.min(2.2, width - 1.2),
        },
        { kind: "desk", x: 0, z: deskZ, rotation: Math.PI },
        { kind: "office-chair", x: 0, z: deskZ - 0.62, rotation: 0.15 },
        { kind: "dining-chair", x: -0.42, z: deskZ + 0.8, rotation: Math.PI },
        { kind: "dining-chair", x: 0.42, z: deskZ + 0.8, rotation: Math.PI },
        { kind: "pendant", x: 0, z: deskZ, rotation: 0, y: height - 0.95 },
      ],
      [
        // Reading chair by the window, angled into the room.
        {
          kind: "armchair",
          x: -width / 2 + 0.62,
          z: length / 2 - 0.62,
          rotation: (3 * Math.PI) / 4,
        },
        { kind: "floor-lamp", x: -width / 2 + 0.3, z: length / 2 - 0.25, rotation: 0 },
        { kind: "plant", x: width / 2 - 0.35, z: back + 0.4, rotation: 0.3 },
      ],
    ),
    windows: [
      { z: -length * 0.1, width: Math.min(1.5, length * 0.36), sill: 0.8, top: height - 0.4 },
    ],
    rug: { x: 0, z: deskZ + 0.05, quarterTurns: 1 },
    crownMoulding: false,
  };
}

/** Pieces that may tuck under each other, the way chairs sit at a table. */
const tucks = new Set(["dining-chair:dining-table", "office-chair:desk", "dining-chair:desk"]);

export function overlaps(a: FurnitureItem, b: FurnitureItem) {
  if (raisedKinds.has(a.kind) || raisedKinds.has(b.kind)) return false;
  if (tucks.has(`${a.kind}:${b.kind}`) || tucks.has(`${b.kind}:${a.kind}`)) return false;
  const fa = itemFootprint(a);
  const fb = itemFootprint(b);
  const clearance = 0.02;
  return (
    Math.abs(a.x - b.x) < (fa.width + fb.width) / 2 - clearance &&
    Math.abs(a.z - b.z) < (fa.depth + fb.depth) / 2 - clearance
  );
}

/** Core pieces always stay; the extras (plants, lamps, a sideboard) only where the floor is free. */
function arrange(core: FurnitureItem[], extras: FurnitureItem[]): FurnitureItem[] {
  const placed = [...core];
  for (const item of extras) if (!placed.some((other) => overlaps(item, other))) placed.push(item);
  return placed;
}

/** Axis-aligned footprint of a placed item on the floor, for the 2D plan. */
export function itemFootprint(item: FurnitureItem) {
  const size = furnitureSize[item.kind];
  const width = item.width ?? size.width;
  const depth = item.depth ?? size.depth;
  const cos = Math.abs(Math.cos(item.rotation));
  const sin = Math.abs(Math.sin(item.rotation));
  return { width: width * cos + depth * sin, depth: width * sin + depth * cos };
}
