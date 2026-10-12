import { describe, expect, it } from "vitest";

import { createDefaultRoomLayout, MAX_ROOM_ITEMS, roomLayoutSchema } from "./room.schema";

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

  it("fills fields that older links did not carry", () => {
    const layout = createDefaultRoomLayout("kashan-red");
    const older: Record<string, unknown> = { ...layout };
    delete older.light;
    delete older.floorStyle;
    const parsed = roomLayoutSchema.parse({
      ...older,
      items: [{ id: "s", kind: "sofa", seats: 2, color: "#8f877d", x: 0, z: 0, rotation: 0 }],
    });
    expect(parsed.light).toBe("noon");
    expect(parsed.floorStyle).toBe("planks");
    expect(parsed.items[0]).toMatchObject({ style: "modern", chaise: "none" });
  });

  it("caps how many items a layout can hold, so a shared link stays small", () => {
    const layout = createDefaultRoomLayout("kashan-red");
    const first = layout.items[0];
    if (!first) throw new Error("default room has no items");
    layout.items = Array.from({ length: MAX_ROOM_ITEMS + 1 }, (_, i) => ({
      ...first,
      id: `x-${i}`,
    }));
    expect(roomLayoutSchema.safeParse(layout).success).toBe(false);
  });
});
