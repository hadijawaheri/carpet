import { describe, expect, it } from "vitest";

import { rackAngle, RackArm } from "./rack-arm";

describe("rackAngle", () => {
  it("puts the current carpet square to the viewer and fans the rest", () => {
    expect(rackAngle(2, 2)).toBe(0);
    expect(rackAngle(3, 2)).toBeGreaterThan(0);
    expect(rackAngle(1, 2)).toBeLessThan(-Math.PI / 2);
    // The most recently turned carpet lies on top of the turned pile.
    expect(rackAngle(1, 2)).toBeGreaterThan(rackAngle(0, 2));
  });
});

describe("RackArm", () => {
  it("turns to its target without overshooting, then stops simulating", () => {
    const arm = new RackArm(0);
    arm.turnTo(-2);
    let lowest = 0;
    for (let i = 0; i < 240; i++) {
      arm.update(1 / 60);
      lowest = Math.min(lowest, arm.angle);
    }
    expect(arm.angle).toBeCloseTo(-2, 2);
    expect(lowest).toBeGreaterThanOrEqual(-2.001);
    for (let i = 0; i < 60 * 5; i++) arm.update(1 / 60);
    expect(arm.active).toBe(false);
  });

  it("waits out its delay before moving", () => {
    const arm = new RackArm(0);
    arm.turnTo(1, 0.5);
    for (let i = 0; i < 20; i++) arm.update(1 / 60);
    expect(arm.angle).toBe(0);
    expect(arm.active).toBe(true);
  });
});
