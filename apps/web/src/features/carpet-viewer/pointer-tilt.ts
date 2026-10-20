/**
 * Pointer offset from the centre of an element, each axis in -0.5…0.5. Mutated by pointer events
 * and read inside the render loop, so moving the mouse never re-renders React.
 */
export class PointerTilt {
  x = 0;
  y = 0;

  track(clientX: number, clientY: number, rect: DOMRect) {
    this.x = rect.width ? (clientX - rect.left) / rect.width - 0.5 : 0;
    this.y = rect.height ? (clientY - rect.top) / rect.height - 0.5 : 0;
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }
}
