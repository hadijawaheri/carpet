import { z } from "zod";

import { pileMaterialSchema } from "../carpet/carpet.schema";

/** Colours are stored as `#rrggbb`: the layout travels in a URL, so it must stay small and exact. */
export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const wallSideSchema = z.enum(["back", "left", "right", "front"]);
export type WallSide = z.infer<typeof wallSideSchema>;

/** Metres from the room's centre. Every item can be dragged anywhere inside the walls. */
const placement = {
  id: z.string().min(1).max(24),
  x: z.number().min(-4).max(4),
  z: z.number().min(-4).max(4),
  /** Radians about the vertical axis; the UI turns items in 15° steps. */
  rotation: z.number().min(-7).max(7),
};

/** Position along a wall, in metres from the wall's middle; wall items hang at a fixed height. */
const onWall = {
  id: z.string().min(1).max(24),
  wall: wallSideSchema,
  along: z.number().min(-4).max(4),
};

export const sofaSchema = z.object({
  ...placement,
  kind: z.literal("sofa"),
  /** One seat is an armchair. */
  seats: z.number().int().min(1).max(5),
  color: hexColorSchema,
});

export const tableSchema = z.object({
  ...placement,
  kind: z.literal("table"),
  shape: z.enum(["round", "rect"]),
  size: z.enum(["s", "m", "l"]),
  height: z.enum(["coffee", "dining"]),
  color: hexColorSchema,
});

export const paintingSchema = z.object({
  ...onWall,
  kind: z.literal("painting"),
  size: z.enum(["s", "m", "l"]),
  orientation: z.enum(["portrait", "landscape"]),
  /** Height of the painting's centre above the floor, in metres. */
  y: z.number().min(0.6).max(2.4),
  frameColor: hexColorSchema,
  /** The painting is two colour fields: a ground and an accent block. No image is drawn or generated. */
  fill: hexColorSchema,
  accent: hexColorSchema,
});

export const curtainSchema = z.object({
  ...onWall,
  kind: z.literal("curtain"),
  /** Width of the window the curtains frame, in metres. */
  width: z.number().min(0.8).max(3.2),
  color: hexColorSchema,
});

export const roomItemSchema = z.discriminatedUnion("kind", [
  sofaSchema,
  tableSchema,
  paintingSchema,
  curtainSchema,
]);
export type RoomItem = z.infer<typeof roomItemSchema>;
export type RoomItemKind = RoomItem["kind"];
export type SofaItem = z.infer<typeof sofaSchema>;
export type TableItem = z.infer<typeof tableSchema>;
export type PaintingItem = z.infer<typeof paintingSchema>;
export type CurtainItem = z.infer<typeof curtainSchema>;

export const roomRugSchema = z.object({
  /** Slug of one of the owner's carpet photos. */
  carpet: z.string().regex(/^[a-z0-9-]+$/),
  material: pileMaterialSchema,
  x: z.number().min(-4).max(4),
  z: z.number().min(-4).max(4),
  rotation: z.number().min(-7).max(7),
  /** Multiplies the carpet's listed size, so a visitor can try a smaller or larger one. */
  scale: z.number().min(0.6).max(1.6),
});
export type RoomRug = z.infer<typeof roomRugSchema>;

export const roomLayoutSchema = z.object({
  version: z.literal(1),
  room: z.object({
    width: z.number().min(3).max(8),
    depth: z.number().min(3).max(8),
    height: z.number().min(2.4).max(3.4),
  }),
  walls: z.object({
    back: hexColorSchema,
    left: hexColorSchema,
    right: hexColorSchema,
    front: hexColorSchema,
  }),
  floor: hexColorSchema,
  rug: roomRugSchema,
  items: z.array(roomItemSchema).max(24),
});
export type RoomLayout = z.infer<typeof roomLayoutSchema>;

/** A calm starting room, so the first view already shows a carpet in a believable setting. */
export function createDefaultRoomLayout(carpetSlug: string): RoomLayout {
  return {
    version: 1,
    room: { width: 5, depth: 4, height: 2.7 },
    walls: { back: "#efe6d6", left: "#e7dccb", right: "#e7dccb", front: "#efe6d6" },
    floor: "#a98562",
    rug: { carpet: carpetSlug, material: "wool", x: 0, z: 0.2, rotation: 0, scale: 1 },
    items: [
      {
        id: "sofa-1",
        kind: "sofa",
        seats: 3,
        color: "#8f877d",
        x: 0,
        z: -1.55,
        rotation: 0,
      },
      {
        id: "table-1",
        kind: "table",
        shape: "round",
        size: "m",
        height: "coffee",
        color: "#3b2a20",
        x: 0,
        z: 0.2,
        rotation: 0,
      },
      {
        id: "painting-1",
        kind: "painting",
        wall: "back",
        along: 0,
        size: "m",
        orientation: "landscape",
        y: 1.6,
        frameColor: "#2a1b14",
        fill: "#d9c7a8",
        accent: "#8a2a2e",
      },
      {
        id: "curtain-1",
        kind: "curtain",
        wall: "right",
        along: 0.4,
        width: 1.6,
        color: "#d3c4aa",
      },
    ],
  };
}
