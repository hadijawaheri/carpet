import {
  type Carpet,
  createDefaultRoomLayout,
  type FloorStyle,
  isFloorItem,
  MAX_ROOM_ITEMS,
  type RoomItem,
  type RoomItemKind,
  type RoomLayout,
  type RoomLight,
  type RoomRug,
  type WallSide,
} from "@farsh/contracts";

import { hexToHsl, mixHex, reshape } from "@/lib/color";
import type { RoomPalette } from "@/lib/image-palette";

import { cabinetShapes, SOFA } from "../data/catalog";
import { type AspectOf, normalizeLayout, rugSize } from "./room-geometry";

export type RoomChange =
  | { type: "load"; layout: RoomLayout }
  | { type: "reset"; carpetSlug: string }
  | { type: "room"; patch: Partial<RoomLayout["room"]> }
  | { type: "wall"; side: WallSide | "all"; color: string }
  | { type: "floor"; color: string }
  | { type: "floorStyle"; style: FloorStyle }
  | { type: "light"; light: RoomLight }
  | { type: "add"; item: RoomItem }
  | { type: "replace"; item: RoomItem }
  | { type: "remove"; id: string }
  | { type: "rug"; patch: Partial<RoomRug> }
  | { type: "palette"; palette: RoomPalette };

/**
 * `group` folds a run of changes into one undo step: every move of one drag, every tick of one slider.
 * Changes without a group are each their own step.
 */
export type RoomAction = (RoomChange & { group?: string }) | { type: "undo" } | { type: "redo" };

export interface RoomState {
  layout: RoomLayout;
  carpets: Carpet[];
  past?: RoomLayout[];
  future?: RoomLayout[];
  group?: string | null;
}

const HISTORY = 80;

export function aspectLookup(carpets: Carpet[]): AspectOf {
  return (slug) => carpets.find((c) => c.slug === slug)?.imageAspect;
}

function rugFootprint(layout: RoomLayout, carpets: Carpet[]) {
  const carpet = carpets.find((c) => c.slug === layout.rug.carpet) ?? carpets[0];
  if (!carpet) return undefined;
  const size = rugSize(layout.rug, carpet);
  return { width: size.width, depth: size.length };
}

/** Walls are one colour unless a visitor sets them apart; the two side walls sit a shade darker, as light falls. */
function wallsFrom(base: string) {
  const side = reshape(base, { l: Math.max(0, Math.min(1, hexToHsl(base).l - 0.03)) });
  return { back: base, front: base, left: side, right: side };
}

function change(layout: RoomLayout, action: RoomChange): RoomLayout {
  switch (action.type) {
    case "load":
      return action.layout;
    case "reset":
      return createDefaultRoomLayout(action.carpetSlug, layout.rug.lengthCm);
    case "room":
      return { ...layout, room: { ...layout.room, ...action.patch } };
    case "wall":
      return {
        ...layout,
        walls:
          action.side === "all"
            ? wallsFrom(action.color)
            : { ...layout.walls, [action.side]: action.color },
      };
    case "floor":
      return { ...layout, floor: action.color };
    case "floorStyle":
      return { ...layout, floorStyle: action.style };
    case "light":
      return { ...layout, light: action.light };
    case "add":
      return { ...layout, items: [...layout.items, action.item].slice(0, MAX_ROOM_ITEMS) };
    case "replace":
      return {
        ...layout,
        items: layout.items.map((item) => (item.id === action.item.id ? action.item : item)),
      };
    case "remove":
      return { ...layout, items: layout.items.filter((item) => item.id !== action.id) };
    case "rug":
      return { ...layout, rug: { ...layout.rug, ...action.patch } };
    case "palette":
      return applyPalette(layout, action.palette);
  }
}

/** Every change goes through here, so no item can be left floating outside the walls, and each can be undone. */
export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  const past = state.past ?? [];
  const future = state.future ?? [];
  if (action.type === "undo") {
    const previous = past.at(-1);
    if (!previous) return state;
    return {
      ...state,
      layout: previous,
      past: past.slice(0, -1),
      future: [state.layout, ...future],
      group: null,
    };
  }
  if (action.type === "redo") {
    const next = future[0];
    if (!next) return state;
    return {
      ...state,
      layout: next,
      past: [...past, state.layout],
      future: future.slice(1),
      group: null,
    };
  }
  const changed = change(state.layout, action);
  const settled = normalizeLayout(
    changed,
    rugFootprint(changed, state.carpets),
    aspectLookup(state.carpets),
  );
  if (action.type === "load")
    return { ...state, layout: settled, past: [], future: [], group: null };
  const sameStep = action.group !== undefined && action.group === state.group;
  return {
    ...state,
    layout: settled,
    past: sameStep ? past : [...past, state.layout].slice(-HISTORY),
    future: [],
    group: action.group ?? null,
  };
}

/** Dresses the whole room from a palette: walls and every piece's main colour. */
export function applyPalette(layout: RoomLayout, palette: RoomPalette): RoomLayout {
  return {
    ...layout,
    walls: wallsFrom(palette.wall),
    items: layout.items.map((item): RoomItem => {
      switch (item.kind) {
        case "sofa":
          return { ...item, color: palette.sofa };
        case "table":
          return { ...item, color: palette.table, chairColor: palette.sofa };
        case "cabinet":
          return { ...item, color: palette.table };
        case "pouf":
          return { ...item, color: palette.paintingAccent };
        case "lamp":
          return { ...item, color: mixHex(palette.curtain, "#ffffff", 0.5) };
        case "plant":
          return item;
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

function wallItemCount(layout: RoomLayout, wall: WallSide) {
  return layout.items.filter((i) => !isFloorItem(i) && i.wall === wall).length;
}

/** The wall with the fewest things on it, so a new curtain or painting does not land on top of one already hung. */
function emptiestWall(layout: RoomLayout): WallSide {
  // The front wall is hidden from the overview camera, so it counts as busier than it is: a new item should be seen when added.
  const load = (wall: WallSide) => wallItemCount(layout, wall) + (wall === "front" ? 1 : 0);
  return WALL_ORDER.reduce((best, wall) => (load(wall) < load(best) ? wall : best), WALL_ORDER[0]!);
}

/** A new item with sensible defaults, placed where such a piece usually stands. */
export function createItem(kind: RoomItemKind, layout: RoomLayout): RoomItem {
  const id = nextId(kind);
  const { width, depth } = layout.room;
  switch (kind) {
    case "sofa":
      return {
        id,
        kind,
        seats: 2,
        style: "modern",
        chaise: "none",
        color: "#c9b79c",
        legColor: "#2b1f19",
        x: 0,
        z: depth / 2 - SOFA.depth / 2,
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
        chairs: 0,
        chairColor: "#8f877d",
        x: 0,
        z: 0,
        rotation: 0,
      };
    case "lamp":
      return {
        id,
        kind,
        color: "#efe3cc",
        metal: "#b89a5e",
        lit: true,
        x: -width / 2 + 0.35,
        z: depth / 2 - 0.35,
        rotation: 0,
      };
    case "plant":
      return {
        id,
        kind,
        size: "m",
        potColor: "#a65f3d",
        x: width / 2 - 0.4,
        z: depth / 2 - 0.4,
        rotation: 0,
      };
    case "cabinet":
      return {
        id,
        kind,
        variant: "tv",
        width: 1.6,
        color: "#3b2a20",
        x: -width / 2 + cabinetShapes.tv.depth / 2,
        z: 0,
        rotation: Math.PI / 2,
      };
    case "pouf":
      return { id, kind, shape: "round", color: "#c98f4a", x: 0.9, z: 0.9, rotation: 0 };
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
        art: "colors",
        frame: "thin",
        frameColor: "#2a1b14",
        fill: "#d9c7a8",
        accent: "#2f3f63",
      };
    }
    case "curtain":
      return {
        id,
        kind,
        wall: emptiestWall(layout),
        along: 0,
        width: 1.4,
        fabric: "heavy",
        color: "#d3c4aa",
      };
  }
}

/** A copy set slightly apart from the original, so the two do not hide each other. */
export function duplicateItem(item: RoomItem, layout: RoomLayout): RoomItem {
  const { id } = createItem(item.kind, layout);
  if (isFloorItem(item)) return { ...item, id, x: item.x + 0.45, z: item.z + 0.3 };
  return { ...item, id, along: item.along + 0.5 };
}

/** Distance in metres a keyboard nudge or an arrow button moves an item. */
export const NUDGE = 0.1;

/** Moves an item by room axes (floor items) or along its wall (wall items). */
export function nudgeItem(item: RoomItem, dx: number, dz: number): RoomItem {
  if (isFloorItem(item)) return { ...item, x: item.x + dx, z: item.z + dz };
  if (item.kind === "painting") return { ...item, along: item.along + dx, y: item.y - dz };
  return { ...item, along: item.along + dx };
}

/** A cushion colour a touch lighter than the frame under it, so seats read as separate pieces. */
export const cushionColor = (body: string) => mixHex(body, "#ffffff", 0.08);
