import { describe, expect, it } from "vitest";

import { pileMaterialSchema } from "./carpet.schema";
import { materialPresets } from "./material-presets";

describe("materialPresets", () => {
  it("has a preset for every pile material", () => {
    expect(Object.keys(materialPresets).sort()).toEqual([...pileMaterialSchema.options].sort());
  });

  it("orders stiffness silk < wool < machine so the feel differs", () => {
    const { silk, wool, machine } = materialPresets;
    expect(silk.physics.bendStiffness).toBeLessThan(wool.physics.bendStiffness);
    expect(wool.physics.bendStiffness).toBeLessThan(machine.physics.bendStiffness);
    expect(silk.physics.damping).toBeGreaterThan(machine.physics.damping);
  });

  it("keeps every physics value in its valid range", () => {
    for (const { physics } of Object.values(materialPresets)) {
      expect(physics.damping).toBeGreaterThan(0);
      expect(physics.damping).toBeLessThan(1);
      expect(physics.restore).toBeGreaterThanOrEqual(0);
      expect(physics.iterations).toBeGreaterThanOrEqual(1);
    }
  });
});
