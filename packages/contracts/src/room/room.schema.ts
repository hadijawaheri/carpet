import { z } from "zod";

import { pileMaterialSchema } from "../carpet/carpet.schema";

/** Colours are stored as `#rrggbb`: the layout travels in a URL, so it must stay small and exact. */
export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const wallSideSchema = z.enum(["back", "left", "right", "front"]);
export type WallSide = z.infer<typeof wallSideSchema>;

/** Metres from the room's centre. Every floor item can be dragged anywhere inside the walls. */
const placement = {
  id: z.string().min(1).max(24),
  x: z.number().min(-4).max(4),
  z: z.number().min(-4).max(4),
  /** Radians about the vertical axis; any angle, so a piece can sit askew as it would in a real room. */
  rotation: z.number().min(-7).max(7),
};

/** Position along a wall, in metres from the wall's middle. */
const onWall = {
  id: z.string().min(1).max(24),
  wall: wallSideSchema,
  along: z.number().min(-4).max(4),
};

const sizeSchema = z.enum(["s", "m", "l"]);

export const sofaSchema = z.object({
  ...placement,
  kind: z.literal("sofa"),
  /** One seat is an armchair. */
  seats: z.number().int().min(1).max(5),
  /** Modern: square arms and slim legs. Classic: rolled arms, a skirt and a buttoned back. */
  style: z.enum(["modern", "classic"]).default("modern"),
  /** A chaise turns the sofa into an L; the side is as seen when sitting on it. */
  chaise: z.enum(["none", "left", "right"]).default("none"),
  color: hexColorSchema,
  legColor: hexColorSchema.default("#2b1f19"),
});

export const tableSchema = z.object({
  ...placement,
  kind: z.literal("table"),
  shape: z.enum(["round", "rect"]),
  size: sizeSchema,
  height: z.enum(["coffee", "side", "dining"]),
  color: hexColorSchema,
  /** Chairs around a dining table; ignored for the low tables. */
  chairs: z.number().int().min(0).max(8).default(0),
  chairColor: hexColorSchema.default("#8f877d"),
});

export const lampSchema = z.object({
  ...placement,
  kind: z.literal("lamp"),
  color: hexColorSchema,
  metal: hexColorSchema.default("#b89a5e"),
  /** A lit lamp lights the room, which matters most in the evening and night light. */
  lit: z.boolean().default(true),
});

export const plantSchema = z.object({
  ...placement,
  kind: z.literal("plant"),
  size: sizeSchema,
  potColor: hexColorSchema,
});

export const cabinetSchema = z.object({
  ...placement,
  kind: z.literal("cabinet"),
  variant: z.enum(["console", "tv", "bookcase"]),
  /** Width in metres. */
  width: z.number().min(0.6).max(2.6),
  color: hexColorSchema,
});

export const poufSchema = z.object({
  ...placement,
  kind: z.literal("pouf"),
  shape: z.enum(["round", "square"]),
  color: hexColorSchema,
});

export const paintingSchema = z.object({
  ...onWall,
  kind: z.literal("painting"),
  size: sizeSchema,
  orientation: z.enum(["portrait", "landscape"]),
  /** Height of the painting's centre above the floor, in metres. */
  y: z.number().min(0.4).max(2.6),
  /**
   * What the frame holds: two colour fields, one of the owner's carpet photos hung as a tableau
   * (تابلو فرش), or the visitor's own picture, which never leaves their device.
   */
  art: z.enum(["colors", "carpet", "photo"]).default("colors"),
  /** Slug of the carpet photo when `art` is "carpet". */
  carpet: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  frame: z.enum(["thin", "wood", "gold", "none"]).default("thin"),
  frameColor: hexColorSchema,
  fill: hexColorSchema,
  accent: hexColorSchema,
});

export const curtainSchema = z.object({
  ...onWall,
  kind: z.literal("curtain"),
  /** Width of the window the curtains frame, in metres. */
  width: z.number().min(0.8).max(3.2),
  /** Heavy drapes, or sheer voile that lets the light through. */
  fabric: z.enum(["heavy", "sheer"]).default("heavy"),
  color: hexColorSchema,
});

export const roomItemSchema = z.discriminatedUnion("kind", [
  sofaSchema,
  tableSchema,
  lampSchema,
  plantSchema,
  cabinetSchema,
  poufSchema,
  paintingSchema,
  curtainSchema,
]);
export type RoomItem = z.infer<typeof roomItemSchema>;
export type RoomItemKind = RoomItem["kind"];
export type SofaItem = z.infer<typeof sofaSchema>;
export type TableItem = z.infer<typeof tableSchema>;
export type LampItem = z.infer<typeof lampSchema>;
export type PlantItem = z.infer<typeof plantSchema>;
export type CabinetItem = z.infer<typeof cabinetSchema>;
export type PoufItem = z.infer<typeof poufSchema>;
export type PaintingItem = z.infer<typeof paintingSchema>;
export type CurtainItem = z.infer<typeof curtainSchema>;
export type FloorItem = SofaItem | TableItem | LampItem | PlantItem | CabinetItem | PoufItem;
export type WallItem = PaintingItem | CurtainItem;

export const floorItemKinds = ["sofa", "table", "lamp", "plant", "cabinet", "pouf"] as const;

export function isFloorItem(item: RoomItem): item is FloorItem {
  return item.kind !== "painting" && item.kind !== "curtain";
}

export const roomRugSchema = z.object({
  /** Slug of one of the owner's carpet photos. */
  carpet: z.string().regex(/^[a-z0-9-]+$/),
  material: pileMaterialSchema,
  x: z.number().min(-4).max(4),
  z: z.number().min(-4).max(4),
  rotation: z.number().min(-7).max(7),
  /** Length on the floor in centimetres; the width follows the photo, so the design is never stretched. */
  lengthCm: z.number().min(60).max(600),
});
export type RoomRug = z.infer<typeof roomRugSchema>;

export const roomLightSchema = z.enum(["morning", "noon", "evening", "night"]);
export type RoomLight = z.infer<typeof roomLightSchema>;

export const floorStyleSchema = z.enum(["planks", "herringbone", "tiles", "concrete"]);
export type FloorStyle = z.infer<typeof floorStyleSchema>;

export const MAX_ROOM_ITEMS = 32;

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
  floorStyle: floorStyleSchema.default("planks"),
  /** Time of day: a carpet's colours read differently in morning sun and under a lamp at night. */
  light: roomLightSchema.default("noon"),
  rug: roomRugSchema,
  items: z.array(roomItemSchema).max(MAX_ROOM_ITEMS),
});
export type RoomLayout = z.infer<typeof roomLayoutSchema>;

/** A calm starting room, so the first view already shows a carpet in a believable setting. */
export function createDefaultRoomLayout(carpetSlug: string, lengthCm = 300): RoomLayout {
  return {
    version: 1,
    room: { width: 5, depth: 4.2, height: 2.8 },
    walls: { back: "#efe6d6", left: "#e7dccb", right: "#e7dccb", front: "#efe6d6" },
    floor: "#a98562",
    floorStyle: "planks",
    light: "noon",
    rug: { carpet: carpetSlug, material: "wool", x: 0, z: 0.25, rotation: 0, lengthCm },
    items: [
      {
        id: "sofa-1",
        kind: "sofa",
        seats: 3,
        style: "modern",
        chaise: "none",
        color: "#8f877d",
        legColor: "#2b1f19",
        x: 0,
        z: -1.64,
        rotation: 0,
      },
      {
        id: "table-1",
        kind: "table",
        shape: "round",
        size: "m",
        height: "coffee",
        color: "#3b2a20",
        chairs: 0,
        chairColor: "#8f877d",
        x: 0,
        z: 0.15,
        rotation: 0,
      },
      {
        id: "lamp-1",
        kind: "lamp",
        color: "#efe3cc",
        metal: "#b89a5e",
        lit: true,
        x: -2.05,
        z: -1.7,
        rotation: 0,
      },
      {
        id: "plant-1",
        kind: "plant",
        size: "l",
        potColor: "#c9b79c",
        x: 2.05,
        z: -1.7,
        rotation: 0,
      },
      {
        id: "painting-1",
        kind: "painting",
        wall: "back",
        along: 0,
        size: "m",
        orientation: "landscape",
        y: 1.65,
        art: "colors",
        frame: "thin",
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
        fabric: "heavy",
        color: "#d3c4aa",
      },
    ],
  };
}
