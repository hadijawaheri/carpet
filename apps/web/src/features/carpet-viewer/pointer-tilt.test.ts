import { describe, expect, it } from "vitest";

import { PointerTilt } from "./pointer-tilt";

const rect = { left: 100, top: 50, width: 200, height: 100 } as DOMRect;

describe("PointerTilt", () => {
  it("maps the pointer to -0.5…0.5 from the element centre", () => {
    const tilt = new PointerTilt();
    tilt.track(300, 50, rect);
    expect(tilt.x).toBe(0.5);
    expect(tilt.y).toBe(-0.5);
    tilt.reset();
    expect([tilt.x, tilt.y]).toEqual([0, 0]);
  });

  it("stays at rest for an element with no size", () => {
    const tilt = new PointerTilt();
    tilt.track(10, 10, { left: 0, top: 0, width: 0, height: 0 } as DOMRect);
    expect([tilt.x, tilt.y]).toEqual([0, 0]);
  });
});
