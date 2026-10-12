"use client";

import { Canvas, events as pointerEvents } from "@react-three/fiber";
import type { ComponentProps } from "react";
import { type Intersection, NeutralToneMapping, type Object3D, PCFShadowMap } from "three";

import { ROOM_FOV } from "./camera-rig";
import { RoomScene } from "./room-scene";

function shown(object: Object3D) {
  for (let node: Object3D | null = object; node; node = node.parent) {
    if (!node.visible) return false;
  }
  return true;
}

type Store = Parameters<typeof pointerEvents>[0];

/**
 * three.js picks hidden objects too. The walls nearest the camera are hidden so the room can be seen into,
 * and without this they would take every click meant for what lies behind them.
 */
function visibleEvents(store: Store) {
  return {
    ...pointerEvents(store),
    filter: (hits: Intersection[]) => hits.filter((hit) => shown(hit.object)),
  };
}

/** The WebGL canvas around the room. Loaded on demand: three.js is the heaviest part of the page. */
export function RoomCanvas(props: ComponentProps<typeof RoomScene>) {
  return (
    <Canvas
      shadows={{ type: PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [1.2, 4.2, 7], fov: ROOM_FOV, near: 0.05, far: 80 }}
      gl={{
        antialias: true,
        // Neutral keeps a picked colour close to what it was picked as; the room is for judging colour.
        toneMapping: NeutralToneMapping,
        toneMappingExposure: 1.3,
      }}
      events={visibleEvents}
      style={{ touchAction: "none" }}
    >
      <RoomScene {...props} />
    </Canvas>
  );
}
