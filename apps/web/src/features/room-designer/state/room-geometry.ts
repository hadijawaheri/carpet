import {
  type FloorItem,
  isFloorItem,
  type RoomItem,
  type RoomLayout,
  type RoomRug,
  type WallItem,
  type WallSide,
} from "@farsh/contracts";

import {
  cabinetShapes,
  CHAIR,
  LAMP,
  paintingDimensions,
  plantSizes,
  POUF,
  SOFA,
  tableDimensions,
  WINDOW,
} from "../data/catalog";

type Room = RoomLayout["room"];

/** Space an item takes on the floor before it is turned. `offsetZ` moves the box forward of the item's origin. */
export interface Footprint {
  width: number;
  depth: number;
  offsetZ?: number;
}

/** Looks up a carpet photo's aspect, for paintings that hold one. */
export type AspectOf = (slug: string | undefined) => number | undefined;

export function floorFootprint(item: FloorItem): Footprint {
  switch (item.kind) {
    case "sofa": {
      const width = item.seats * SOFA.seatWidth + 2 * SOFA.arm;
      if (item.chaise === "none") return { width, depth: SOFA.depth };
      return {
        width,
        depth: SOFA.chaiseLength,
        offsetZ: (SOFA.chaiseLength - SOFA.depth) / 2,
      };
    }
    case "table": {
      const { width, depth } = tableDimensions(item);
      if (item.height !== "dining" || item.chairs === 0) return { width, depth };
      return { width: width + 2 * CHAIR.reach, depth: depth + 2 * CHAIR.reach };
    }
    case "lamp":
      return { width: LAMP.shade, depth: LAMP.shade };
    case "plant": {
      const d = plantSizes[item.size].pot + 0.2;
      return { width: d, depth: d };
    }
    case "cabinet":
      return { width: item.width, depth: cabinetShapes[item.variant].depth };
    case "pouf":
      return { width: POUF.size, depth: POUF.size };
  }
}

/** Height of a floor item's top, for placing things above it. */
export function floorHeight(item: FloorItem): number {
  switch (item.kind) {
    case "sofa":
      return SOFA.backTop;
    case "table":
      return tableDimensions(item).height;
    case "lamp":
      return LAMP.height;
    case "plant":
      return plantSizes[item.size].height;
    case "cabinet":
      return cabinetShapes[item.variant].height;
    case "pouf":
      return POUF.height;
  }
}

/** Half the width of an item along a wall. */
export function wallHalfWidth(item: WallItem, aspectOf?: AspectOf): number {
  if (item.kind === "painting") return paintingDimensions(item, aspectOf?.(item.carpet)).width / 2;
  return item.width / 2 + WINDOW.rodOverhang;
}

export interface WallFrame {
  /** Centre of the wall's floor line. */
  x: number;
  z: number;
  /** Turns a mesh whose +z faces out of the wall (and +x runs left to right as you face it) onto this wall. */
  rotationY: number;
  /** Direction along the wall, left to right as seen from inside the room. */
  tangent: { x: number; z: number };
  /** Direction out of the wall into the room. */
  normal: { x: number; z: number };
  length: number;
}

export function wallFrame(wall: WallSide, room: Room): WallFrame {
  switch (wall) {
    case "back":
      return {
        x: 0,
        z: -room.depth / 2,
        rotationY: 0,
        tangent: { x: 1, z: 0 },
        normal: { x: 0, z: 1 },
        length: room.width,
      };
    case "front":
      return {
        x: 0,
        z: room.depth / 2,
        rotationY: Math.PI,
        tangent: { x: -1, z: 0 },
        normal: { x: 0, z: -1 },
        length: room.width,
      };
    case "left":
      return {
        x: -room.width / 2,
        z: 0,
        rotationY: Math.PI / 2,
        tangent: { x: 0, z: -1 },
        normal: { x: 1, z: 0 },
        length: room.depth,
      };
    case "right":
      return {
        x: room.width / 2,
        z: 0,
        rotationY: -Math.PI / 2,
        tangent: { x: 0, z: 1 },
        normal: { x: -1, z: 0 },
        length: room.depth,
      };
  }
}

/** Room-aligned half extents and centre offset of a footprint turned by `rotation`. */
export function turnedBox(footprint: Footprint, rotation: number) {
  const c = Math.abs(Math.cos(rotation));
  const s = Math.abs(Math.sin(rotation));
  const oz = footprint.offsetZ ?? 0;
  return {
    hx: (c * footprint.width + s * footprint.depth) / 2,
    hz: (s * footprint.width + c * footprint.depth) / 2,
    // three.js turns +z towards +x for a positive angle about y.
    ox: oz * Math.sin(rotation),
    oz: oz * Math.cos(rotation),
  };
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Keeps a turned footprint inside the walls. A room smaller than the item pins it to the middle. */
export function clampToRoom(
  room: Room,
  x: number,
  z: number,
  footprint: Footprint,
  rotation: number,
) {
  const { hx, hz, ox, oz } = turnedBox(footprint, rotation);
  const maxX = Math.max(0, room.width / 2 - hx);
  const maxZ = Math.max(0, room.depth / 2 - hz);
  return { x: clamp(x + ox, -maxX, maxX) - ox, z: clamp(z + oz, -maxZ, maxZ) - oz };
}

/** Gaps in metres from a floor item's turned box to each wall: what a measuring tape would read. */
export function wallGaps(room: Room, x: number, z: number, footprint: Footprint, rotation: number) {
  const { hx, hz, ox, oz } = turnedBox(footprint, rotation);
  const cx = x + ox;
  const cz = z + oz;
  return {
    left: cx - hx + room.width / 2,
    right: room.width / 2 - (cx + hx),
    back: cz - hz + room.depth / 2,
    front: room.depth / 2 - (cz + hz),
    box: { cx, cz, hx, hz },
  };
}

export function clampAlong(
  room: Room,
  item: WallItem,
  wall: WallSide,
  along: number,
  aspectOf?: AspectOf,
) {
  const limit = Math.max(
    0,
    wallFrame(wall, room).length / 2 - wallHalfWidth(item, aspectOf) - 0.05,
  );
  return clamp(along, -limit, limit);
}

const SNAP_DISTANCE = 0.22;

/**
 * Sofas lean on walls: within a hand's width of one, a sofa slides flush and turns its back to it.
 * Returns the placement unchanged when no wall is close.
 */
export function snapSofaToWall(
  room: Room,
  x: number,
  z: number,
  rotation: number,
  footprint: Footprint,
) {
  const half = SOFA.depth / 2;
  const candidates = [
    { gap: z + room.depth / 2 - half, x, z: -room.depth / 2 + half, rotation: 0 },
    { gap: room.depth / 2 - half - z, x, z: room.depth / 2 - half, rotation: Math.PI },
    { gap: x + room.width / 2 - half, x: -room.width / 2 + half, z, rotation: Math.PI / 2 },
    { gap: room.width / 2 - half - x, x: room.width / 2 - half, z, rotation: -Math.PI / 2 },
  ];
  let best: (typeof candidates)[number] | undefined;
  for (const candidate of candidates) {
    if (candidate.gap < SNAP_DISTANCE && (!best || candidate.gap < best.gap)) best = candidate;
  }
  if (!best) return { x, z, rotation };
  return {
    ...clampToRoom(room, best.x, best.z, footprint, best.rotation),
    rotation: best.rotation,
  };
}

/** Size of the rug on the floor, in metres: the chosen length, and the width the photo gives it. */
export function rugSize(rug: RoomRug, carpet: { imageAspect: number }) {
  const length = rug.lengthCm / 100;
  return { width: length * carpet.imageAspect, length };
}

/** Pulls every item back inside the walls after the room or an item changed. */
export function normalizeLayout(
  layout: RoomLayout,
  rugFootprint?: Footprint,
  aspectOf?: AspectOf,
): RoomLayout {
  const items = layout.items.map((item): RoomItem => {
    if (isFloorItem(item)) {
      return {
        ...item,
        ...clampToRoom(layout.room, item.x, item.z, floorFootprint(item), item.rotation),
      };
    }
    const half =
      item.kind === "painting" ? paintingDimensions(item, aspectOf?.(item.carpet)).height / 2 : 0;
    const along = clampAlong(layout.room, item, item.wall, item.along, aspectOf);
    if (item.kind !== "painting") return { ...item, along };
    const y = clamp(
      item.y,
      Math.max(0.4, half + 0.15),
      Math.min(2.6, layout.room.height - half - 0.05),
    );
    return { ...item, along, y };
  });
  const rug = rugFootprint
    ? {
        ...layout.rug,
        ...clampToRoom(layout.room, layout.rug.x, layout.rug.z, rugFootprint, layout.rug.rotation),
      }
    : layout.rug;
  return { ...layout, items, rug };
}
