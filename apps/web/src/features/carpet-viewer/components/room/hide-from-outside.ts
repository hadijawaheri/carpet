import { useFrame } from "@react-three/fiber";
import { type RefObject } from "react";
import type { Material, Mesh, Object3D } from "three";

export type Side = "back" | "front" | "start" | "end" | "ceiling";

/**
 * Dollhouse view: a wall (or the ceiling) the camera is behind stops drawing, so the room opens
 * towards the viewer from any angle. It still writes to the shadow map, so sunlight only enters
 * through the windows.
 */
function isOutside(
  side: Side,
  { x, y, z }: { x: number; y: number; z: number },
  room: { width: number; length: number; height: number },
) {
  switch (side) {
    case "back":
      return z < -room.length / 2;
    case "front":
      return z > room.length / 2;
    case "start":
      return x < -room.width / 2;
    case "end":
      return x > room.width / 2;
    case "ceiling":
      return y > room.height;
  }
}

/** Which wall a wall-mounted piece hangs on, from its turn (it faces into the room). */
export function wallFacing(rotation: number): Side {
  const quarter = ((Math.round(rotation / (Math.PI / 2)) % 4) + 4) % 4;
  return (["back", "start", "front", "end"] as const)[quarter]!;
}

/** For pieces hung on a wall (art, mirrors): they disappear with their wall. */
export function useHideWithWall(
  ref: RefObject<Object3D | null>,
  side: Side,
  room: { width: number; length: number; height: number },
) {
  useFrame(({ camera }) => {
    if (ref.current) ref.current.visible = !isOutside(side, camera.position, room);
  });
}

export function useHideFromOutside(
  ref: RefObject<Object3D | null>,
  side: Side | Side[],
  room: { width: number; length: number; height: number },
) {
  useFrame(({ camera }) => {
    const group = ref.current;
    if (!group) return;
    const outside = ([] as Side[]).concat(side).some((s) => isOutside(s, camera.position, room));
    // Checked every frame: trim and windows can mount after the wall was hidden.
    group.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      for (const material of ([] as Material[]).concat(mesh.material)) {
        if (material.colorWrite === !outside) continue;
        material.colorWrite = !outside;
        // Glass and sheers never write depth, so only solid surfaces get it back.
        material.depthWrite = !outside && !material.transparent;
      }
    });
  });
}
