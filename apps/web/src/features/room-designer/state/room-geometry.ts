import type { RoomItem, RoomLayout, RoomRug, WallSide } from "@farsh/contracts";

import { paintingDimensions, SOFA, tableDimensions, WINDOW } from "../data/catalog";

type Room = RoomLayout["room"];

/** Space an item takes on the floor, before it is turned. */
export function floorFootprint(item: RoomItem): { width: number; depth: number } {
  if (item.kind === "sofa") {
    return { width: item.seats * SOFA.seatWidth + 2 * SOFA.arm, depth: SOFA.depth };
  }
  if (item.kind === "table") {
    const { width, depth } = tableDimensions(item);
    return { width, depth };
  }
  return { width: 0, depth: 0 };
}

/** Half the width of an item along a wall. */
export function wallHalfWidth(item: RoomItem): number {
  if (item.kind === "painting") return paintingDimensions(item).width / 2;
  if (item.kind === "curtain") return item.width / 2 + WINDOW.rodOverhang;
  return 0;
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

/** Room-aligned half extents of a footprint turned by `rotation`. */
function turnedHalfExtents(width: number, depth: number, rotation: number) {
  const c = Math.abs(Math.cos(rotation));
  const s = Math.abs(Math.sin(rotation));
  return { hx: (c * width + s * depth) / 2, hz: (s * width + c * depth) / 2 };
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Keeps a turned footprint inside the walls. A room smaller than the item pins it to the middle. */
export function clampToRoom(
  room: Room,
  x: number,
  z: number,
  footprint: { width: number; depth: number },
  rotation: number,
) {
  const { hx, hz } = turnedHalfExtents(footprint.width, footprint.depth, rotation);
  const maxX = Math.max(0, room.width / 2 - hx);
  const maxZ = Math.max(0, room.depth / 2 - hz);
  return { x: clamp(x, -maxX, maxX), z: clamp(z, -maxZ, maxZ) };
}

export function clampAlong(room: Room, item: RoomItem, wall: WallSide, along: number) {
  const limit = Math.max(0, wallFrame(wall, room).length / 2 - wallHalfWidth(item) - 0.05);
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
  footprint: { width: number; depth: number },
) {
  const half = footprint.depth / 2;
  const candidates = [
    { gap: z + room.depth / 2 - half, x, z: -room.depth / 2 + half, rotation: 0 },
    { gap: room.depth / 2 - half - z, x, z: room.depth / 2 - half, rotation: Math.PI },
    { gap: x + room.width / 2 - half, x: -room.width / 2 + half, z, rotation: -Math.PI / 2 },
    { gap: room.width / 2 - half - x, x: room.width / 2 - half, z, rotation: Math.PI / 2 },
  ];
  let best: (typeof candidates)[number] | undefined;
  for (const candidate of candidates) {
    if (candidate.gap < SNAP_DISTANCE && (!best || candidate.gap < best.gap)) best = candidate;
  }
  if (!best) return { x, z, rotation };
  return clampPlacement(room, best, footprint);
}

function clampPlacement(
  room: Room,
  p: { x: number; z: number; rotation: number },
  footprint: { width: number; depth: number },
) {
  return { ...clampToRoom(room, p.x, p.z, footprint, p.rotation), rotation: p.rotation };
}

/** Size of the rug on the floor, in metres, from the owner's listed size and the visitor's scale. */
export function rugSize(rug: RoomRug, carpet: { lengthCm: number; imageAspect: number }) {
  const length = (carpet.lengthCm / 100) * rug.scale;
  return { width: length * carpet.imageAspect, length };
}

/** Pulls every item back inside the walls after the room or an item changed. */
export function normalizeLayout(
  layout: RoomLayout,
  rugFootprint?: { width: number; depth: number },
): RoomLayout {
  const items = layout.items.map((item): RoomItem => {
    if (item.kind === "sofa" || item.kind === "table") {
      const spot = clampToRoom(layout.room, item.x, item.z, floorFootprint(item), item.rotation);
      return { ...item, ...spot };
    }
    return { ...item, along: clampAlong(layout.room, item, item.wall, item.along) };
  });
  const rug = rugFootprint
    ? {
        ...layout.rug,
        ...clampToRoom(layout.room, layout.rug.x, layout.rug.z, rugFootprint, layout.rug.rotation),
      }
    : layout.rug;
  return { ...layout, items, rug };
}
