import { materialPresets } from "@farsh/contracts";
import { describe, expect, it } from "vitest";

import { ClothSolver } from "./cloth-solver";

const STEP = 1 / 60;

describe("ClothSolver", () => {
  it("builds a grid that follows the photo's aspect ratio", () => {
    const cloth = new ClothSolver(1.4, 2.1, 20);
    expect(cloth.rows).toBe(30);
    expect(cloth.indices.length).toBe((20 - 1) * (30 - 1) * 6);
  });

  it("stays flat at rest when there is no wind", () => {
    const cloth = new ClothSolver(1, 1.5, 12);
    for (let i = 0; i < 120; i++) cloth.step(STEP, i * STEP, materialPresets.silk.physics, false);
    const maxZ = Math.max(
      ...Array.from(
        cloth.positions.filter((_, i) => i % 3 === 2),
        Math.abs,
      ),
    );
    expect(maxZ).toBeLessThan(1e-6);
  });

  it("pins the grabbed particle to the pointer target", () => {
    const cloth = new ClothSolver(1, 1.5, 12);
    cloth.grabNearest(-0.5, 0.75, 0);
    cloth.moveTarget(-0.8, 1, 0.4);
    for (let i = 0; i < 30; i++) cloth.step(STEP, i * STEP, materialPresets.wool.physics, false);
    expect(Array.from(cloth.positions.slice(0, 3))).toEqual([
      expect.closeTo(-0.8, 5),
      expect.closeTo(1, 5),
      expect.closeTo(0.4, 5),
    ]);
  });

  it("settles a machine-made carpet faster than silk after the same kick", () => {
    const ripple = (material: "silk" | "machine") => {
      const cloth = new ClothSolver(1, 1.5, 12);
      cloth.impulse(0.05);
      for (let i = 0; i < 90; i++)
        cloth.step(STEP, i * STEP, materialPresets[material].physics, false);
      return Math.max(
        ...Array.from(
          cloth.positions.filter((_, i) => i % 3 === 2),
          Math.abs,
        ),
      );
    };
    expect(ripple("machine")).toBeLessThan(ripple("silk"));
  });

  it("keeps the top row on the rod while the hanging carpet is lifted", () => {
    const cloth = new ClothSolver(1, 1.5, 12);
    cloth.setHanging(true);
    const last = cloth.particleCount - 1;
    cloth.grabNearest(cloth.positions[last * 3]!, cloth.positions[last * 3 + 1]!, 0);
    cloth.moveTarget(0.2, 0.2, 0.8);
    for (let i = 0; i < 60; i++) cloth.step(STEP, i * STEP, materialPresets.silk.physics, true);
    for (let c = 0; c < cloth.cols; c++) {
      expect(cloth.positions[c * 3 + 1]).toBeCloseTo(0.75, 5);
      expect(cloth.positions[c * 3 + 2]).toBeCloseTo(0, 5);
    }
  });
});
