import type { RoomDimensions } from "./room-config";

export interface RugSize {
  /** Metres. */
  width: number;
  length: number;
}

/** Floor footprint of the carpet: a quarter turn lays its length along x. */
export function rugFootprint(rug: RugSize, quarterTurns: number) {
  return quarterTurns % 2 === 0 ? { x: rug.width, z: rug.length } : { x: rug.length, z: rug.width };
}

const WALL_MARGIN = 0.02;

/** Keeps the carpet on the floor; one too big for the room stays centred on that axis. */
export function clampToRoom(
  x: number,
  z: number,
  footprint: { x: number; z: number },
  room: Pick<RoomDimensions, "width" | "length">,
) {
  const clamp = (value: number, half: number, roomHalf: number) => {
    const limit = roomHalf - half - WALL_MARGIN;
    return limit <= 0 ? 0 : Math.min(limit, Math.max(-limit, value));
  };
  return {
    x: clamp(x, footprint.x / 2, room.width / 2),
    z: clamp(z, footprint.z / 2, room.length / 2),
  };
}

export type FitStatus = "too-big" | "tight" | "balanced" | "small";

export interface FitAssessment {
  status: FitStatus;
  /** Share of the floor the carpet covers, 0–1. */
  coverage: number;
  /** Bare floor between each carpet edge and the wall, in metres (negative = overlaps the wall). */
  gaps: { start: number; end: number; back: number; front: number };
}

/**
 * Designers leave a band of bare floor round a large carpet, and a small one should still anchor
 * the furniture; `minCoverage` is that threshold for the kind of room.
 */
export function assessFit(
  room: Pick<RoomDimensions, "width" | "length">,
  rug: RugSize,
  quarterTurns: number,
  position: { x: number; z: number },
  minCoverage: number,
): FitAssessment {
  const footprint = rugFootprint(rug, quarterTurns);
  const gaps = {
    start: room.width / 2 + position.x - footprint.x / 2,
    end: room.width / 2 - position.x - footprint.x / 2,
    back: room.length / 2 + position.z - footprint.z / 2,
    front: room.length / 2 - position.z - footprint.z / 2,
  };
  const coverage = (footprint.x * footprint.z) / (room.width * room.length);
  const freeX = room.width - footprint.x;
  const freeZ = room.length - footprint.z;
  let status: FitStatus;
  if (freeX < 0 || freeZ < 0) status = "too-big";
  else if (Math.min(freeX, freeZ) < 0.4) status = "tight";
  else if (coverage < minCoverage) status = "small";
  else status = "balanced";
  return { status, coverage, gaps };
}
