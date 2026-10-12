import { createDefaultRoomLayout } from "@farsh/contracts";
import { describe, expect, it } from "vitest";

import { decodeLayout, encodeLayout } from "./room-codec";

describe("room codec", () => {
  it("round-trips a layout through a URL-safe string", () => {
    const layout = createDefaultRoomLayout("kashan-red");
    const encoded = encodeLayout(layout);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeLayout(encoded)).toEqual(layout);
  });

  it("returns null for garbage, truncated links and valid JSON of the wrong shape", () => {
    expect(decodeLayout("")).toBeNull();
    expect(decodeLayout("not base64 !!")).toBeNull();
    const encoded = encodeLayout(createDefaultRoomLayout("kashan-red"));
    expect(decodeLayout(encoded.slice(0, 40))).toBeNull();
    expect(decodeLayout(btoa('{"version":2}'))).toBeNull();
  });

  it("keeps a typical room small enough for a link", () => {
    expect(encodeLayout(createDefaultRoomLayout("kashan-red")).length).toBeLessThan(1500);
  });
});
