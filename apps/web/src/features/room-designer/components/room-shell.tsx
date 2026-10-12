"use client";

import type { FloorStyle, RoomLayout, WallSide } from "@farsh/contracts";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, useRef } from "react";
import { BackSide, type Group, type Texture } from "three";

import { mixHex } from "@/lib/color";

import { wallFrame } from "../state/room-geometry";
import { concreteTexture, herringboneTexture, plankTexture, tileTexture } from "../three/textures";

export type RoomView = "orbit" | "inside" | "top";

const THICKNESS = 0.12;
const WALLS: WallSide[] = ["back", "right", "left", "front"];
/** Height the walls shrink to in the plan view, so the floor reads as a floor plan. */
const PLAN_WALL_HEIGHT = 0.05;
const CORNICE = 0.07;

/** Each floor finish, and the span in metres one repeat of its texture covers. */
const floorFinish: Record<FloorStyle, { texture: () => Texture; span: number; roughness: number }> =
  {
    planks: { texture: plankTexture, span: 1, roughness: 0.62 },
    // Blocks of about 30 × 15 cm, a common parquet size.
    herringbone: { texture: herringboneTexture, span: 2.4, roughness: 0.5 },
    tiles: { texture: tileTexture, span: 1.2, roughness: 0.32 },
    concrete: { texture: concreteTexture, span: 3, roughness: 0.7 },
  };

interface WallAssemblyProps {
  wall: WallSide;
  layout: RoomLayout;
  view: RoomView;
  reducedMotion: boolean;
  onBackgroundClick: () => void;
  children: ReactNode;
}

/**
 * One wall and everything hung on it. From outside the room the walls that face the camera drop away,
 * like a dolls' house; in plan view every wall shrinks to a low edge and the wall items hide.
 */
function WallAssembly({
  wall,
  layout,
  view,
  reducedMotion,
  onBackgroundClick,
  children,
}: WallAssemblyProps) {
  const { room, walls } = layout;
  const frame = wallFrame(wall, room);
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const items = useRef<Group>(null);
  const grow = useRef(1);

  useFrame(({ camera }, delta) => {
    const rootGroup = root.current;
    if (!rootGroup) return;
    // Positive when the camera is on the room side of the wall; negative when it looks at the wall from outside.
    const side =
      (camera.position.x - frame.x) * frame.normal.x +
      (camera.position.z - frame.z) * frame.normal.z;
    rootGroup.visible = view === "top" || side > -0.05;
    const target = view === "top" ? PLAN_WALL_HEIGHT / room.height : 1;
    grow.current = reducedMotion
      ? target
      : grow.current + (target - grow.current) * Math.min(1, delta * 8);
    body.current?.scale.set(1, grow.current, 1);
    if (items.current) items.current.visible = grow.current > 0.7;
  });

  const color = walls[wall];
  const length = wall === "back" || wall === "front" ? room.width + 2 * THICKNESS : room.depth;
  const trim = mixHex(color, "#ffffff", 0.6);

  return (
    <group ref={root} position={[frame.x, 0, frame.z]} rotation={[0, frame.rotationY, 0]}>
      <group ref={body}>
        <mesh
          position={[0, room.height / 2, -THICKNESS / 2]}
          receiveShadow
          onClick={(event) => {
            if (event.delta > 4) return;
            event.stopPropagation();
            onBackgroundClick();
          }}
        >
          <boxGeometry args={[length, room.height, THICKNESS]} />
          <meshStandardMaterial color={color} roughness={0.96} />
        </mesh>
        {/* Skirting with a small top bead, and a cornice under the ceiling: a plain box room reads as a model. */}
        <mesh position={[0, 0.05, 0.011]} receiveShadow castShadow>
          <boxGeometry args={[length, 0.1, 0.022]} />
          <meshStandardMaterial color={trim} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.104, 0.006]}>
          <boxGeometry args={[length, 0.008, 0.012]} />
          <meshStandardMaterial color={trim} roughness={0.6} />
        </mesh>
        <mesh position={[0, room.height - CORNICE / 2, CORNICE / 2 - 0.01]}>
          <boxGeometry args={[length, CORNICE, CORNICE]} />
          <meshStandardMaterial color={trim} roughness={0.8} />
        </mesh>
      </group>
      <group ref={items}>{children}</group>
    </group>
  );
}

interface RoomShellProps {
  layout: RoomLayout;
  view: RoomView;
  reducedMotion: boolean;
  wallItems: Record<WallSide, ReactNode>;
  onBackgroundClick: () => void;
}

export function RoomShell({
  layout,
  view,
  reducedMotion,
  wallItems,
  onBackgroundClick,
}: RoomShellProps) {
  const { room, floor, floorStyle } = layout;
  const finish = floorFinish[floorStyle];
  const texture = finish.texture();

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(event) => {
          if (event.delta > 4) return;
          event.stopPropagation();
          onBackgroundClick();
        }}
      >
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial
          key={floorStyle}
          color={floor}
          map={texture}
          map-repeat={[room.width / finish.span, room.depth / finish.span]}
          roughness={finish.roughness}
        />
      </mesh>
      {/* Only seen from inside: from the overview the room is open to the sky, like a model. */}
      {view === "inside" ? (
        <mesh position={[0, room.height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[room.width, room.depth]} />
          <meshStandardMaterial
            color={mixHex(layout.walls.back, "#ffffff", 0.5)}
            roughness={1}
            side={BackSide}
          />
        </mesh>
      ) : null}
      {WALLS.map((wall) => (
        <WallAssembly
          key={wall}
          wall={wall}
          layout={layout}
          view={view}
          reducedMotion={reducedMotion}
          onBackgroundClick={onBackgroundClick}
        >
          {wallItems[wall]}
        </WallAssembly>
      ))}
    </group>
  );
}
