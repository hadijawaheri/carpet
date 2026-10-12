import {
  type Carpet,
  createDefaultRoomLayout,
  type RoomItem,
  type RoomItemKind,
  type RoomLayout,
  type RoomRug,
  type WallSide,
} from "@farsh/contracts";

import { mixHex, reshape } from "@/lib/color";
import type { RoomPalette } from "@/lib/image-palette";

import { floorFootprint, normalizeLayout, rugSize } from "./room-geometry";

export type RoomAction =
  | { type: "load"; layout: RoomLayout }
  | { type: "reset"; carpetSlug: string }
  | { type: "room"; patch: Partial<RoomLayout["room"]> }
  | { type: "wall"; side: WallSide | "all"; color: string }
  | { type: "floor"; color: string }
  | { type: "add"; item: RoomItem }
  | { type: "replace"; item: RoomItem }
  | { type: "remove"; id: string }
  | { type: "rug"; patch: Partial<RoomRug> }
  | { type: "palette"; palette: RoomPalette };

export interface RoomState {
  layout: RoomLayout;
  carpets: Carpet[];
}

function rugFootprint(layout: RoomLayout, carpets: Carpet[]) {
  const carpet = carpets.find((c) => c.slug === layout.rug.carpet) ?? carpets[0];
  if (!carpet) return undefined;
  const size = rugSize(layout.rug, carpet);
  return { width: size.width, depth: size.length };
}

/** Every change goes through here, so no item can be left floating outside the walls. */
function settle(state: RoomState, layout: RoomLayout): RoomState {
  return { ...state, layout: normalizeLayout(layout, rugFootprint(layout, state.carpets)) };
}

/** Walls are one colour unless a visitor sets them apart; the two side walls sit a shade darker, as light falls. */
function wallsFrom(base: string) {
  const side = reshape(base, { l: Math.max(0, Math.min(1, reshapeLightness(base) - 0.03)) });
  return { back: base, front: base, left: side, right: side };
}

function reshapeLightness(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
}

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  const { layout } = state;
  switch (action.type) {
    case "load":
      return settle(state, action.layout);
    case "reset":
      return settle(state, createDefaultRoomLayout(action.carpetSlug));
    case "room":
      return settle(state, { ...layout, room: { ...layout.room, ...action.patch } });
    case "wall":
      return settle(state, {
        ...layout,
        walls:
          action.side === "all"
            ? wallsFrom(action.color)
            : { ...layout.walls, [action.side]: action.color },
      });
    case "floor":
      return settle(state, { ...layout, floor: action.color });
    case "add":
      return settle(state, { ...layout, items: [...layout.items, action.item].slice(0, 24) });
    case "replace":
      return settle(state, {
        ...layout,
        items: layout.items.map((item) => (item.id === action.item.id ? action.item : item)),
      });
    case "remove":
      return settle(state, {
        ...layout,
        items: layout.items.filter((item) => item.id !== action.id),
      });
    case "rug":
      return settle(state, { ...layout, rug: { ...layout.rug, ...action.patch } });
    case "palette":
      return settle(state, applyPalette(layout, action.palette));
  }
}

/** Dresses the whole room from a palette: walls, every sofa, table, curtain and painting. */
export function applyPalette(layout: RoomLayout, palette: RoomPalette): RoomLayout {
  return {
    ...layout,
    walls: wallsFrom(palette.wall),
    items: layout.items.map((item): RoomItem => {
      switch (item.kind) {
        case "sofa":
          return { ...item, color: palette.sofa };
        case "table":
          return { ...item, color: palette.table };
        case "curtain":
          return { ...item, color: palette.curtain };
        case "painting":
          return {
            ...item,
            frameColor: palette.frame,
            fill: palette.paintingFill,
            accent: palette.paintingAccent,
          };
      }
    }),
  };
}

let counter = 0;
const nextId = (kind: RoomItemKind) =>
  `${kind}-${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Walls in the order a new wall item prefers them: the three a camera in the overview can see come before the one it cannot. */
const WALL_ORDER: WallSide[] = ["back", "left", "right", "front"];

/** The wall with the fewest things on it, so a new curtain or painting does not land on top of one already hung. */
function emptiestWall(layout: RoomLayout): WallSide {
  // The front wall is hidden from the overview camera, so it counts as busier than it is: a new item should be seen when added.
  const load = (wall: WallSide) => wallItemCount(layout, wall) + (wall === "front" ? 1 : 0);
  return WALL_ORDER.reduce((best, wall) => (load(wall) < load(best) ? wall : best), WALL_ORDER[0]!);
}

function wallItemCount(layout: RoomLayout, wall: WallSide) {
  return layout.items.filter(
    (i) => (i.kind === "painting" || i.kind === "curtain") && i.wall === wall,
  ).length;
}

/** A new item with sensible defaults. Curtains take the first wall that has none yet. */
export function createItem(kind: RoomItemKind, layout: RoomLayout): RoomItem {
  const id = nextId(kind);
  switch (kind) {
    case "sofa":
      return {
        id,
        kind,
        seats: 2,
        color: "#c9b79c",
        x: 0,
        z: layout.room.depth / 2 - 1,
        rotation: Math.PI,
      };
    case "table":
      return {
        id,
        kind,
        shape: "rect",
        size: "m",
        height: "coffee",
        color: "#6b4a30",
        x: 0,
        z: 0,
        rotation: 0,
      };
    case "painting": {
      const wall = emptiestWall(layout);
      return {
        id,
        kind,
        wall,
        // Side by side rather than stacked when the wall already has something on it.
        along: [0, 1, -1][wallItemCount(layout, wall) % 3]! * 1.1,
        size: "m",
        orientation: "portrait",
        y: 1.6,
        frameColor: "#2a1b14",
        fill: "#d9c7a8",
        accent: "#2f3f63",
      };
    }
    case "curtain":
      return { id, kind, wall: emptiestWall(layout), along: 0, width: 1.4, color: "#d3c4aa" };
  }
}

/** A copy set slightly apart from the original, so the two do not hide each other. */
export function duplicateItem(item: RoomItem, layout: RoomLayout): RoomItem {
  const { id } = createItem(item.kind, layout);
  if (item.kind === "sofa" || item.kind === "table")
    return { ...item, id, x: item.x + 0.45, z: item.z + 0.3 };
  return { ...item, id, along: item.along + 0.5 };
}

/** Distance in metres a keyboard nudge or an arrow button moves an item. */
export const NUDGE = 0.1;

/** Moves a floor item by room axes, keeping it inside the walls. */
export function nudgeItem(item: RoomItem, dx: number, dz: number): RoomItem {
  if (item.kind === "sofa" || item.kind === "table")
    return { ...item, x: item.x + dx, z: item.z + dz };
  if (item.kind === "painting") return { ...item, along: item.along + dx, y: item.y - dz };
  return { ...item, along: item.along + dx };
}

export function floorItemFootprint(item: RoomItem) {
  return floorFootprint(item);
}

/** A cushion colour a touch lighter than the frame under it, so seats read as separate pieces. */
export const cushionColor = (body: string) => mixHex(body, "#ffffff", 0.08);
