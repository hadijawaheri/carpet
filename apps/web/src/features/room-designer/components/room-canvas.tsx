"use client";

import { Canvas } from "@react-three/fiber";
import type { ComponentProps } from "react";
import { NeutralToneMapping, PCFShadowMap } from "three";

import { ROOM_FOV } from "./camera-rig";
import { RoomScene } from "./room-scene";

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
      style={{ touchAction: "none" }}
    >
      <RoomScene {...props} />
    </Canvas>
  );
}
