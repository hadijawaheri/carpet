import { describe, expect, it } from "vitest";

import {
  clampDimension,
  dimensionLimits,
  presetConfig,
  roomTypeOrder,
  roomTypes,
} from "./room-config";
import { furnitureSize, itemFootprint, layoutRoom, overlaps, raisedKinds } from "./room-layout";
import { assessFit, clampToRoom, rugFootprint } from "./rug-fit";
import { RugPlacement } from "./rug-placement";
import { createRugGrid, unrollProgress, unrollRug } from "./rug-unroll";

describe("layoutRoom", () => {
  const sizes = (type: (typeof roomTypeOrder)[number]) => {
    const limits = dimensionLimits(type);
    return [
      roomTypes[type].dimensions,
      { width: limits.width.min, length: limits.length.min, height: limits.height.min },
      { width: limits.width.max, length: limits.length.max, height: limits.height.max },
      { width: limits.width.min, length: limits.length.max, height: limits.height.min },
      { width: limits.width.max, length: limits.length.min, height: limits.height.max },
    ];
  };

  it.each(roomTypeOrder)("keeps every %s item inside the room at any size", (type) => {
    for (const room of sizes(type)) {
      const layout = layoutRoom(type, room);
      for (const item of layout.furniture) {
        const { width, depth } = itemFootprint(item);
        expect(Math.abs(item.x) + width / 2, `${type} ${item.kind} x`).toBeLessThanOrEqual(
          room.width / 2 + 1e-6,
        );
        expect(Math.abs(item.z) + depth / 2, `${type} ${item.kind} z`).toBeLessThanOrEqual(
          room.length / 2 + 1e-6,
        );
      }
      for (const window of layout.windows) {
        expect(Math.abs(window.z) + window.width / 2).toBeLessThan(room.length / 2);
        expect(window.top).toBeLessThan(room.height);
      }
    }
  });

  it.each(roomTypeOrder)("never stacks two %s floor items on each other", (type) => {
    for (const room of sizes(type)) {
      const items = layoutRoom(type, room).furniture;
      for (const [i, a] of items.entries()) {
        for (const b of items.slice(i + 1)) {
          expect(
            overlaps(a, b),
            `${type} ${room.width}×${room.length}: ${a.kind} / ${b.kind}`,
          ).toBe(false);
        }
      }
    }
  });

  it("hangs lights from the ceiling and keeps them out of the floor plan", () => {
    const room = roomTypes.salon.dimensions;
    const lights = layoutRoom("salon", room).furniture.filter((i) => i.kind === "chandelier");
    expect(lights).toHaveLength(2);
    for (const light of lights) expect(light.y).toBe(room.height);
    expect(raisedKinds.has("chandelier")).toBe(true);
  });

  it("gives a salon its dining table and a bedroom its bed", () => {
    const kinds = (type: (typeof roomTypeOrder)[number]) =>
      layoutRoom(type, roomTypes[type].dimensions).furniture.map((i) => i.kind);
    expect(kinds("salon")).toContain("dining-table");
    expect(kinds("bedroom")).toContain("bed");
    expect(kinds("office")).toContain("desk");
  });

  it("swaps the footprint of a quarter-turned item", () => {
    expect(itemFootprint({ kind: "sofa", x: 0, z: 0, rotation: Math.PI / 2 }).width).toBeCloseTo(
      furnitureSize.sofa.depth,
    );
  });
});

describe("room config", () => {
  it("clamps slider values to the limits, to one decimal", () => {
    expect(clampDimension("living", "width", 1)).toBe(3);
    expect(clampDimension("living", "length", 99)).toBe(14);
    expect(clampDimension("living", "height", 2.84)).toBe(2.8);
    expect(clampDimension("salon", "width", 3)).toBe(5.5);
  });

  it("starts each preset in daylight with its own size", () => {
    expect(presetConfig("salon")).toMatchObject({
      type: "salon",
      width: 7,
      length: 10,
      light: "day",
    });
  });
});

describe("rug fit", () => {
  const room = { width: 4, length: 5 };
  const rug = { width: 2, length: 3 };

  it("turns the footprint a quarter turn", () => {
    expect(rugFootprint(rug, 1)).toEqual({ x: 3, z: 2 });
    expect(rugFootprint(rug, 2)).toEqual({ x: 2, z: 3 });
  });

  it("keeps the carpet off the walls and centres one that is too big", () => {
    expect(clampToRoom(5, -5, { x: 2, z: 3 }, room)).toEqual({ x: 0.98, z: -0.98 });
    expect(clampToRoom(1, 1, { x: 6, z: 3 }, room).x).toBe(0);
  });

  it("measures bare floor on each side", () => {
    const fit = assessFit(room, rug, 0, { x: 0.5, z: 0 }, 0.1);
    expect(fit.gaps.start).toBeCloseTo(1.5);
    expect(fit.gaps.end).toBeCloseTo(0.5);
    expect(fit.gaps.back).toBeCloseTo(1);
    expect(fit.coverage).toBeCloseTo(0.3);
    expect(fit.status).toBe("balanced");
  });

  it("grades too big, tight and small carpets", () => {
    expect(assessFit(room, { width: 3, length: 6 }, 0, { x: 0, z: 0 }, 0.1).status).toBe("too-big");
    expect(assessFit(room, { width: 3.8, length: 4 }, 0, { x: 0, z: 0 }, 0.1).status).toBe("tight");
    expect(assessFit(room, { width: 1, length: 1.5 }, 0, { x: 0, z: 0 }, 0.1).status).toBe("small");
  });
});

describe("RugPlacement", () => {
  it("clamps drags, notifies only when a move ends, and re-clamps after a turn", () => {
    const placement = new RugPlacement();
    let calls = 0;
    placement.subscribe(() => calls++);
    placement.reset(
      { width: 4, length: 5 },
      { width: 2, length: 3 },
      { x: 0, z: 0, quarterTurns: 0 },
    );
    placement.startDrag();
    placement.dragTo(9, 0);
    placement.dragTo(9, 9);
    expect(calls).toBe(2);
    expect(placement.x).toBeCloseTo(0.98);
    expect(placement.z).toBeCloseTo(0.98);
    placement.endDrag();
    expect(placement.getSnapshot()).toMatchObject({ dragging: false, z: placement.z });
    placement.rotate();
    expect(placement.quarterTurns).toBe(1);
    expect(placement.x).toBeCloseTo(0.48);
    expect(placement.z).toBeCloseTo(0.98);
  });
});

describe("unrollRug", () => {
  it("lies flat at full progress", () => {
    const grid = createRugGrid(1.5, 2.25);
    for (let i = 1; i < grid.positions.length; i += 3) expect(grid.positions[i]).toBe(0);
    expect(grid.positions[2]).toBeCloseTo(-1.125);
    expect(grid.positions.at(-1)).toBeCloseTo(1.125);
  });

  it("rolls into a cylinder about 19 cm across at the far end", () => {
    const grid = createRugGrid(1.5, 2.25);
    unrollRug(grid, 0, 0.01);
    let top = 0;
    let far = -Infinity;
    for (let i = 0; i < grid.positions.length; i += 3) {
      top = Math.max(top, grid.positions[i + 1]!);
      far = Math.max(far, grid.positions[i + 2]!);
    }
    expect(top).toBeGreaterThan(0.17);
    expect(top).toBeLessThan(0.2);
    expect(far).toBeLessThan(-1.125 + 0.1);
  });

  it("eases out and stops at 1", () => {
    expect(unrollProgress(0, 2)).toBe(0);
    expect(unrollProgress(1, 2)).toBeGreaterThan(0.5);
    expect(unrollProgress(5, 2)).toBe(1);
  });
});
