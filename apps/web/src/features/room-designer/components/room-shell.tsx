"use client";

import type { RoomLayout, WallSide } from "@farsh/contracts";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { CanvasTexture, type Group, RepeatWrapping, SRGBColorSpace } from "three";

import { mixHex } from "@/lib/color";

import { wallFrame } from "../state/room-geometry";

export type RoomView = "orbit" | "inside" | "top";

const THICKNESS = 0.12;
const WALLS: WallSide[] = ["back", "right", "left", "front"];
/** Height the walls shrink to in the plan view, so the floor reads as a floor plan. */
const PLAN_WALL_HEIGHT = 0.05;

/** A small deterministic generator, so the planks look the same on every load. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Grey planks that the floor colour tints: the tint stays true because the planks average near white. */
function makePlankTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const random = seeded(7);
  if (ctx) {
    const planks = 6;
    const plankHeight = size / planks;
    for (let i = 0; i < planks; i++) {
      const y = i * plankHeight;
      const tone = Math.round(236 + random() * 18);
      ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.fillRect(0, y, size, plankHeight);
      for (let g = 0; g < 7; g++) {
        const gy = y + 4 + random() * (plankHeight - 8);
        ctx.strokeStyle = `rgba(0,0,0,${0.025 + random() * 0.04})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(
          size * 0.3,
          gy + random() * 3 - 1.5,
          size * 0.6,
          gy + random() * 3 - 1.5,
          size,
          gy,
        );
        ctx.stroke();
      }
      const seam = random() * size;
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(seam, y, 2, plankHeight);
      ctx.fillStyle = "rgba(0,0,0,0.34)";
      ctx.fillRect(0, y + plankHeight - 2, size, 2);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

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
  const baseboard = mixHex(color, "#ffffff", 0.6);

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
        <mesh position={[0, 0.045, 0.011]} receiveShadow>
          <boxGeometry args={[length, 0.09, 0.022]} />
          <meshStandardMaterial color={baseboard} roughness={0.7} />
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
  const { room, floor } = layout;
  const texture = useMemo(() => makePlankTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

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
        {/* Repeat once per metre; the texture shows six planks, so a plank is about 17 cm wide. */}
        <meshStandardMaterial
          color={floor}
          map={texture}
          map-repeat={[room.width, room.depth]}
          roughness={0.62}
        />
      </mesh>
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
