import {
  type Carpet,
  createDefaultRoomLayout,
  MAX_ROOM_ITEMS,
  type PaintingItem,
  roomLayoutSchema,
} from "@farsh/contracts";
import { describe, expect, it } from "vitest";

import { suggestPalettes } from "@/lib/image-palette";

import { frameDepth, paintingDimensions } from "../data/catalog";
import { clampToRoom, floorFootprint, snapSofaToWall, wallFrame, wallGaps } from "./room-geometry";
import { createItem, roomReducer, type RoomState } from "./room-reducer";

const carpets: Carpet[] = [
  {
    kind: "rug",
    slug: "kashan-red",
    name: "کاشان سرخ",
    material: "wool",
    widthCm: 200,
    lengthCm: 345,
    image: "/carpets/kashan-red.jpg",
    imageAspect: 0.5768,
    isPlaceholder: true,
  },
];

const start = (): RoomState => ({ layout: createDefaultRoomLayout("kashan-red"), carpets });

describe("roomReducer", () => {
  it("keeps every layout it produces valid", () => {
    let state = start();
    state = roomReducer(state, { type: "wall", side: "all", color: "#2f3f63" });
    state = roomReducer(state, { type: "add", item: createItem("sofa", state.layout) });
    state = roomReducer(state, { type: "add", item: createItem("curtain", state.layout) });
    state = roomReducer(state, { type: "rug", patch: { lengthCm: 420, rotation: 1.2 } });
    expect(roomLayoutSchema.safeParse(state.layout).success).toBe(true);
  });

  it("sets all four walls from one colour, side walls a shade darker", () => {
    const state = roomReducer(start(), { type: "wall", side: "all", color: "#e3d3b8" });
    expect(state.layout.walls.back).toBe("#e3d3b8");
    expect(state.layout.walls.front).toBe("#e3d3b8");
    expect(state.layout.walls.left).toBe(state.layout.walls.right);
    expect(state.layout.walls.left).not.toBe("#e3d3b8");
  });

  it("changes a single wall without touching the others", () => {
    const state = roomReducer(start(), { type: "wall", side: "left", color: "#7a2a30" });
    expect(state.layout.walls.left).toBe("#7a2a30");
    expect(state.layout.walls.right).toBe(start().layout.walls.right);
  });

  it("pulls furniture back inside when the room shrinks", () => {
    let state = roomReducer(start(), { type: "room", patch: { width: 8 } });
    const placed = state.layout.items.find((i) => i.kind === "sofa");
    if (placed?.kind !== "sofa") throw new Error("default room has no sofa");
    state = roomReducer(state, { type: "replace", item: { ...placed, x: 3 } });
    // In an 8 m room a 2.18 m sofa can reach x = 4 - 1.09 and no further.
    expect(state.layout.items.find((i) => i.id === placed.id)).toMatchObject({ x: 2.91 });
    state = roomReducer(state, { type: "room", patch: { width: 3 } });
    const sofa = state.layout.items.find((i) => i.kind === "sofa");
    // In a 3 m room its centre may sit at most 1.5 - 1.09 = 0.41 m off-axis.
    expect(sofa?.kind === "sofa" && Math.abs(sofa.x)).toBeLessThanOrEqual(0.42);
  });

  it("never holds more than the layout's item limit", () => {
    let state = start();
    for (let i = 0; i < 40; i++) {
      state = roomReducer(state, { type: "add", item: createItem("table", state.layout) });
    }
    expect(state.layout.items).toHaveLength(MAX_ROOM_ITEMS);
  });

  it("spreads new curtains over the walls the overview camera can see before using the hidden one", () => {
    let state = start();
    const walls: string[] = [];
    for (let i = 0; i < 3; i++) {
      const item = createItem("curtain", state.layout);
      if (item.kind === "curtain") walls.push(item.wall);
      state = roomReducer(state, { type: "add", item });
    }
    expect(walls[0]).toBe("left");
    expect(walls).not.toContain("front");
  });

  it("dresses the whole room from a palette", () => {
    const palette = suggestPalettes([{ hex: "#a0202a", share: 1 }])[0]!;
    const state = roomReducer(start(), { type: "palette", palette });
    const sofa = state.layout.items.find((i) => i.kind === "sofa");
    expect(sofa?.kind === "sofa" && sofa.color).toBe(palette.sofa);
    expect(state.layout.walls.back).toBe(palette.wall);
  });

  it("removes an item by id", () => {
    const state = roomReducer(start(), { type: "remove", id: "sofa-1" });
    expect(state.layout.items.some((i) => i.id === "sofa-1")).toBe(false);
  });
});

describe("createItem", () => {
  it("hangs a new curtain or painting on the emptiest wall, not over one already there", () => {
    const layout = createDefaultRoomLayout("medallion-black");
    // The default room has a painting on the back wall and a curtain on the right wall.
    const curtain = createItem("curtain", layout);
    expect(curtain.kind === "curtain" && curtain.wall).toBe("left");
    const painting = createItem("painting", { ...layout, items: [...layout.items, curtain] });
    // All three visible walls hold one item; the hidden front wall is not chosen, and the painting sits beside the first.
    expect(painting.kind === "painting" && painting.wall).toBe("back");
    expect(painting.kind === "painting" && painting.along).not.toBe(0);
  });
});

describe("room geometry", () => {
  const room = { width: 5, depth: 4, height: 2.7 };

  it("clamps a turned footprint inside the walls", () => {
    const spot = clampToRoom(room, 9, 9, { width: 2, depth: 1 }, Math.PI / 2);
    expect(spot.x).toBeCloseTo(2.5 - 0.5, 5);
    expect(spot.z).toBeCloseTo(2 - 1, 5);
  });

  it("snaps a sofa flush against a nearby wall and turns its back to it", () => {
    const footprint = { width: 2.3, depth: 0.92 };
    const snapped = snapSofaToWall(room, 0.3, -1.45, 0.4, footprint);
    expect(snapped.rotation).toBe(0);
    expect(snapped.z).toBeCloseTo(-2 + 0.46, 5);
    const free = snapSofaToWall(room, 0.3, 0.2, 0.4, footprint);
    expect(free).toEqual({ x: 0.3, z: 0.2, rotation: 0.4 });
  });

  it("gives each wall a frame whose normal points into the room", () => {
    for (const wall of ["back", "front", "left", "right"] as const) {
      const f = wallFrame(wall, room);
      // Standing a metre inside along the normal must be nearer the centre than the wall itself.
      const inside = Math.hypot(f.x + f.normal.x, f.z + f.normal.z);
      expect(inside).toBeLessThan(Math.hypot(f.x, f.z));
      expect(f.tangent.x * f.normal.x + f.tangent.z * f.normal.z).toBeCloseTo(0, 9);
    }
  });

  it("measures the gap from a turned footprint to each wall", () => {
    const gaps = wallGaps(room, 1, 0, { width: 2, depth: 1 }, Math.PI / 2);
    // Turned a quarter, the 2 m side runs front to back: 0.5 m each side of x = 1.
    expect(gaps.right).toBeCloseTo(2.5 - 1.5, 5);
    expect(gaps.left).toBeCloseTo(1 - 0.5 + 2.5, 5);
    expect(gaps.back).toBeCloseTo(1, 5);
    expect(gaps.front).toBeCloseTo(1, 5);
  });

  it("moves a chaise sofa's footprint forward of its back", () => {
    const footprint = floorFootprint({
      id: "s",
      kind: "sofa",
      seats: 3,
      style: "modern",
      chaise: "left",
      color: "#8f877d",
      legColor: "#2b1f19",
      x: 0,
      z: 0,
      rotation: 0,
    });
    expect(footprint.offsetZ).toBeGreaterThan(0);
    // Against the back wall, the box must still end at the wall, not the chaise's middle.
    const spot = clampToRoom(room, 0, -9, footprint, 0);
    expect(spot.z - footprint.depth / 2 + (footprint.offsetZ ?? 0)).toBeCloseTo(-2, 5);
  });

  it("keeps a carpet tableau's photo proportions inside any frame", () => {
    const tableau: Pick<PaintingItem, "size" | "orientation" | "art" | "frame"> = {
      size: "m",
      orientation: "portrait",
      art: "carpet",
      frame: "gold",
    };
    const aspect = 0.5768;
    const outer = paintingDimensions(tableau, aspect);
    const bar = 2 * frameDepth.gold;
    expect((outer.width - bar) / (outer.height - bar)).toBeCloseTo(aspect, 5);
  });
});

describe("undo and redo", () => {
  it("undoes a whole drag as one step and redoes it", () => {
    let state = start();
    const before = state.layout.rug.x;
    for (const x of [0.1, 0.2, 0.3]) {
      state = roomReducer(state, { type: "rug", patch: { x }, group: "drag-1" });
    }
    state = roomReducer(state, { type: "undo" });
    expect(state.layout.rug.x).toBe(before);
    state = roomReducer(state, { type: "redo" });
    expect(state.layout.rug.x).toBeCloseTo(0.3, 5);
  });

  it("keeps separate changes as separate steps and drops the redo branch on a new change", () => {
    let state = start();
    state = roomReducer(state, { type: "light", light: "night" });
    state = roomReducer(state, { type: "floorStyle", style: "tiles" });
    state = roomReducer(state, { type: "undo" });
    expect(state.layout.floorStyle).toBe("planks");
    expect(state.layout.light).toBe("night");
    state = roomReducer(state, { type: "light", light: "morning" });
    expect(state.future).toEqual([]);
    expect(roomReducer(state, { type: "redo" })).toBe(state);
  });

  it("does not offer the loaded room itself as a step to undo", () => {
    const state = roomReducer(start(), { type: "load", layout: start().layout });
    expect(state.past).toEqual([]);
    expect(roomReducer(state, { type: "undo" })).toBe(state);
  });
});
