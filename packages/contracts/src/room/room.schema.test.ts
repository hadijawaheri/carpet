import { describe, expect, it } from "vitest";

import { createDefaultRoomLayout, roomLayoutSchema } from "./room.schema";

describe("roomLayoutSchema", () => {
  it("accepts the default room", () => {
    expect(roomLayoutSchema.safeParse(createDefaultRoomLayout("kashan-red")).success).toBe(true);
  });

  it("rejects a colour that is not #rrggbb", () => {
    const layout = createDefaultRoomLayout("kashan-red");
    layout.floor = "red";
    expect(roomLayoutSchema.safeParse(layout).success).toBe(false);
  });

  it("rejects a sofa with no seats and a room that is too small", () => {
    const layout = createDefaultRoomLayout("kashan-red");
    const sofa = layout.items.find((i) => i.kind === "sofa");
    if (sofa?.kind === "sofa") sofa.seats = 0;
    expect(roomLayoutSchema.safeParse(layout).success).toBe(false);
    const small = createDefaultRoomLayout("kashan-red");
    small.room.width = 1;
    expect(roomLayoutSchema.safeParse(small).success).toBe(false);
  });

  it("caps how many items a layout can hold, so a shared link stays small", () => {
    const layout = createDefaultRoomLayout("kashan-red");
    const first = layout.items[0];
    if (!first) throw new Error("default room has no items");
    layout.items = Array.from({ length: 25 }, (_, i) => ({ ...first, id: `x-${i}` }));
    expect(roomLayoutSchema.safeParse(layout).success).toBe(false);
  });
});
