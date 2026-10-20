import type { RoomDimensions } from "./room-config";
import { clampToRoom, rugFootprint, type RugSize } from "./rug-fit";

export interface PlacementSnapshot {
  x: number;
  z: number;
  quarterTurns: number;
  dragging: boolean;
}

/**
 * Where the carpet lies on the floor. The 3D scene moves it every pointer event and reads it every
 * frame; the panel subscribes and re-renders only when a move ends.
 */
export class RugPlacement {
  x = 0;
  z = 0;
  quarterTurns = 0;
  dragging = false;
  private room: Pick<RoomDimensions, "width" | "length"> = { width: 4, length: 5 };
  private rug: RugSize = { width: 1.5, length: 2.25 };
  private snapshot: PlacementSnapshot = { x: 0, z: 0, quarterTurns: 0, dragging: false };
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  /** Puts the carpet at the room's natural spot, e.g. after the room or its size changes. */
  reset(
    room: Pick<RoomDimensions, "width" | "length">,
    rug: RugSize,
    anchor: { x: number; z: number; quarterTurns: number },
  ) {
    this.room = room;
    this.rug = rug;
    this.quarterTurns = anchor.quarterTurns;
    this.place(anchor.x, anchor.z);
    this.publish();
  }

  startDrag() {
    this.dragging = true;
    this.publish();
  }

  /** Moves during a drag without notifying the panel; it updates once on `endDrag`. */
  dragTo(x: number, z: number) {
    this.place(x, z);
  }

  endDrag() {
    this.dragging = false;
    this.publish();
  }

  nudge(dx: number, dz: number) {
    this.place(this.x + dx, this.z + dz);
    this.publish();
  }

  rotate() {
    this.quarterTurns = (this.quarterTurns + 1) % 4;
    this.place(this.x, this.z);
    this.publish();
  }

  private place(x: number, z: number) {
    const clamped = clampToRoom(x, z, rugFootprint(this.rug, this.quarterTurns), this.room);
    this.x = clamped.x;
    this.z = clamped.z;
  }

  private publish() {
    this.snapshot = {
      x: this.x,
      z: this.z,
      quarterTurns: this.quarterTurns,
      dragging: this.dragging,
    };
    for (const listener of this.listeners) listener();
  }
}
