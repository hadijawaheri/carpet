"use client";

import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, type Group, PlaneGeometry, type Texture } from "three";

import type { FloorKind, LightMode, RoomDimensions } from "../../room/room-config";
import type { WindowOpening } from "../../room/room-layout";
import { createFloorFinish, createPlasterTexture } from "../../room/room-textures";
import { type Side, useHideFromOutside } from "./hide-from-outside";

const WALL = 0.15;
const SKIRTING_HEIGHT = 0.11;
const TRIM = "#f6f3ec";

interface RoomShellProps {
  room: RoomDimensions;
  wall: string;
  floor: FloorKind;
  light: LightMode;
  windows: WindowOpening[];
  classic: boolean;
}

export function RoomShell({ room, wall, floor, light, windows, classic }: RoomShellProps) {
  const { width, length, height } = room;
  const plaster = useMemo(() => createPlasterTexture(), []);
  useEffect(() => () => plaster.dispose(), [plaster]);

  return (
    <group>
      <Floor kind={floor} width={width} length={length} />
      <WallPanel
        side="back"
        room={room}
        span={width}
        position={[0, height / 2, -length / 2 - WALL / 2]}
        rotation={0}
        color={wall}
        plaster={plaster}
        classic={classic}
      />
      <WallPanel
        side="front"
        room={room}
        span={width}
        position={[0, height / 2, length / 2 + WALL / 2]}
        rotation={Math.PI}
        color={wall}
        plaster={plaster}
        classic={classic}
      />
      <WallPanel
        side="end"
        room={room}
        span={length}
        position={[width / 2 + WALL / 2, height / 2, 0]}
        rotation={-Math.PI / 2}
        color={wall}
        plaster={plaster}
        classic={classic}
      />
      <WindowWall room={room} windows={windows} color={wall} plaster={plaster} classic={classic} />
      <Ceiling room={room} />
      <SkyPanels windows={windows} room={room} color={SKY[light].bottom} />
    </group>
  );
}

function Floor({ kind, width, length }: { kind: FloorKind; width: number; length: number }) {
  const finish = useMemo(() => createFloorFinish(kind), [kind]);
  useEffect(() => () => finish.map.dispose(), [finish]);
  useEffect(() => {
    finish.map.repeat.set(width / finish.tile, length / finish.tile);
  }, [finish, width, length]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, length]} />
      <meshPhysicalMaterial
        map={finish.map}
        roughness={finish.roughness}
        clearcoat={finish.clearcoat}
        clearcoatRoughness={finish.clearcoatRoughness}
        envMapIntensity={0.9}
      />
    </mesh>
  );
}

interface WallPanelProps {
  side: Side;
  room: RoomDimensions;
  span: number;
  position: [number, number, number];
  /** Turns the wall so its inner face looks into the room. */
  rotation: number;
  color: string;
  plaster: Texture;
  classic: boolean;
}

/** A solid wall: inner face towards local +z, with skirting and, in a classic hall, mouldings. */
function WallPanel({
  side,
  room,
  span,
  position,
  rotation,
  color,
  plaster,
  classic,
}: WallPanelProps) {
  const ref = useRef<Group>(null);
  useHideFromOutside(ref, side, room);
  const { height } = room;
  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[span + WALL * 2, height, WALL]} />
        <meshStandardMaterial color={color} map={plaster} roughness={0.92} />
      </mesh>
      <Trim span={span} height={height} classic={classic} color={color} />
    </group>
  );
}

/** Skirting, and for a classic hall a crown, chair rail and raised panels, on the wall's inner face. */
function Trim({
  span,
  height,
  classic,
  color,
  openings = [],
}: {
  span: number;
  height: number;
  classic: boolean;
  color: string;
  /** Spans along the wall (centre, width) that panels must leave clear. */
  openings?: { centre: number; width: number }[];
}) {
  const face = WALL / 2;
  const floorY = -height / 2;
  const panels = classic ? panelFrames(span, height, openings) : [];
  return (
    <group>
      <mesh position={[0, floorY + SKIRTING_HEIGHT / 2, face + 0.009]} receiveShadow>
        <boxGeometry args={[span, SKIRTING_HEIGHT * (classic ? 1.6 : 1), 0.018]} />
        <meshStandardMaterial color={classic ? color : TRIM} roughness={0.5} />
      </mesh>
      {classic ? (
        <>
          <mesh position={[0, height / 2 - 0.05, face + 0.05]} castShadow>
            <boxGeometry args={[span, 0.1, 0.1]} />
            <meshStandardMaterial color={TRIM} roughness={0.55} />
          </mesh>
          <mesh position={[0, height / 2 - 0.13, face + 0.02]}>
            <boxGeometry args={[span, 0.06, 0.04]} />
            <meshStandardMaterial color={TRIM} roughness={0.55} />
          </mesh>
          {openings.length === 0 ? (
            <mesh position={[0, floorY + 0.92, face + 0.015]}>
              <boxGeometry args={[span, 0.05, 0.03]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          ) : null}
          {panels.map((frame, i) => (
            <PanelFrame key={i} {...frame} z={face} color={color} />
          ))}
        </>
      ) : null}
    </group>
  );
}

function panelFrames(span: number, height: number, openings: { centre: number; width: number }[]) {
  const gap = 0.28;
  const count = Math.max(1, Math.floor(span / 1.4));
  const width = (span - gap * (count + 1)) / count;
  const frames: { x: number; y: number; width: number; height: number }[] = [];
  for (let i = 0; i < count; i++) {
    const x = -span / 2 + gap + width / 2 + i * (width + gap);
    const blocked = openings.some((o) => Math.abs(o.centre - x) < (o.width + width) / 2 + 0.05);
    if (blocked) continue;
    const upperBottom = 1.22;
    const upperTop = height - 0.42;
    frames.push({
      x,
      y: -height / 2 + (upperBottom + upperTop) / 2,
      width,
      height: upperTop - upperBottom,
    });
    frames.push({ x, y: -height / 2 + 0.5, width, height: 0.5 });
  }
  return frames;
}

function PanelFrame({
  x,
  y,
  z,
  width,
  height,
  color,
}: {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  color: string;
}) {
  const bar = 0.035;
  const depth = 0.022;
  const bars: [number, number, number, number][] = [
    [x, y + height / 2, width, bar],
    [x, y - height / 2, width, bar],
    [x - width / 2, y, bar, height],
    [x + width / 2, y, bar, height],
  ];
  return (
    <>
      {bars.map(([bx, by, bw, bh], i) => (
        <mesh key={i} position={[bx, by, z + depth / 2]}>
          <boxGeometry args={[bw, bh, depth]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      ))}
    </>
  );
}

const SKY: Record<LightMode, { bottom: string }> = {
  day: { bottom: "#eef3f6" },
  golden: { bottom: "#ffd7a8" },
  night: { bottom: "#1b2940" },
};

/** The start (−x) wall, built round its window openings, with frames, sills and sheer curtains. */
function WindowWall({
  room,
  windows,
  color,
  plaster,
  classic,
}: {
  room: RoomDimensions;
  windows: WindowOpening[];
  color: string;
  plaster: Texture;
  classic: boolean;
}) {
  const ref = useRef<Group>(null);
  useHideFromOutside(ref, "start", room);
  const { width, length, height } = room;
  const x = -width / 2 - WALL / 2;
  const sorted = [...windows].sort((a, b) => a.z - b.z);

  const solids: { z: number; y: number; depth: number; height: number }[] = [];
  let cursor = -length / 2 - WALL;
  for (const w of sorted) {
    const start = w.z - w.width / 2;
    const end = w.z + w.width / 2;
    solids.push({ z: (cursor + start) / 2, y: height / 2, depth: start - cursor, height });
    solids.push({ z: w.z, y: w.sill / 2, depth: w.width, height: w.sill });
    solids.push({ z: w.z, y: (w.top + height) / 2, depth: w.width, height: height - w.top });
    cursor = end;
  }
  const last = length / 2 + WALL;
  solids.push({ z: (cursor + last) / 2, y: height / 2, depth: last - cursor, height });

  return (
    <group ref={ref}>
      {solids.map((s, i) => (
        <mesh key={i} position={[x, s.y, s.z]} castShadow receiveShadow>
          <boxGeometry args={[WALL, s.height, s.depth]} />
          <meshStandardMaterial color={color} map={plaster} roughness={0.92} />
        </mesh>
      ))}
      <group position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <group position={[0, 0, -WALL / 2]}>
          <Trim
            span={length}
            height={height}
            classic={classic}
            color={color}
            openings={sorted.map((w) => ({ centre: -w.z, width: w.width + 0.8 }))}
          />
        </group>
      </group>
      {sorted.map((w, i) => (
        <WindowUnit key={i} opening={w} wallX={-width / 2} roomHeight={height} classic={classic} />
      ))}
    </group>
  );
}

/**
 * Sky beyond the glass, unlit so it reads as daylight. Hidden from above and from outside the
 * window wall, where the cut-away model would show it floating beside the room.
 */
function SkyPanels({
  windows,
  room,
  color,
}: {
  windows: WindowOpening[];
  room: RoomDimensions;
  color: string;
}) {
  const ref = useRef<Group>(null);
  useHideFromOutside(ref, ["ceiling", "start"], room);
  const { width, height } = room;
  return (
    <group ref={ref}>
      {windows.map((w, i) => {
        const bottom = Math.max(0.02, w.sill - 0.6);
        const top = Math.min(height - 0.02, w.top + 0.6);
        return (
          <mesh
            key={i}
            position={[-width / 2 - WALL - 0.7, (bottom + top) / 2, w.z]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[w.width + 1.4, top - bottom]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function WindowUnit({
  opening,
  wallX,
  roomHeight,
  classic,
}: {
  opening: WindowOpening;
  wallX: number;
  roomHeight: number;
  classic: boolean;
}) {
  const frameColor = classic ? TRIM : "#2b2a28";
  const bar = 0.05;
  const h = opening.top - opening.sill;
  const y = (opening.top + opening.sill) / 2;
  const x = wallX - WALL * 0.6;
  const transom = opening.sill + h * 0.72;
  const curtainTop = Math.min(roomHeight - 0.08, opening.top + 0.22);
  const bars: { y: number; z: number; h: number; w: number }[] = [
    { y: opening.top - bar / 2, z: opening.z, h: bar, w: opening.width },
    { y: opening.sill + bar / 2, z: opening.z, h: bar, w: opening.width },
    { y, z: opening.z - opening.width / 2 + bar / 2, h, w: bar },
    { y, z: opening.z + opening.width / 2 - bar / 2, h, w: bar },
    { y, z: opening.z, h, w: bar * 0.8 },
    { y: transom, z: opening.z, h: bar * 0.8, w: opening.width },
  ];
  return (
    <group>
      {bars.map((b, i) => (
        <mesh key={i} position={[x, b.y, b.z]} castShadow>
          <boxGeometry args={[0.07, b.h, b.w]} />
          <meshStandardMaterial color={frameColor} roughness={0.45} metalness={classic ? 0 : 0.4} />
        </mesh>
      ))}
      <mesh position={[x, y, opening.z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[opening.width, h]} />
        <meshPhysicalMaterial
          color="#dfe9ee"
          transparent
          opacity={0.12}
          roughness={0.04}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
      {opening.sill > 0.3 ? (
        <mesh position={[wallX + 0.03, opening.sill + 0.015, opening.z]} castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.03, opening.width + 0.12]} />
          <meshStandardMaterial color={TRIM} roughness={0.4} />
        </mesh>
      ) : null}
      <mesh position={[wallX + 0.14, curtainTop, opening.z]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, opening.width + 1.3, 12]} />
        <meshStandardMaterial color="#b08d4a" metalness={0.9} roughness={0.35} />
      </mesh>
      {[-1, 1].map((sideSign) => (
        <Curtain
          key={sideSign}
          x={wallX + 0.14}
          z={opening.z + sideSign * (opening.width / 2 + 0.18)}
          top={curtainTop}
        />
      ))}
    </group>
  );
}

/** A gathered sheer panel: a plane folded into soft pleats that hangs to just above the floor. */
function Curtain({ x, z, top }: { x: number; z: number; top: number }) {
  const width = 0.6;
  const drop = top - 0.015;
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(width, drop, 48, 1);
    const position = g.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const u = position.getX(i) / width + 0.5;
      position.setZ(
        i,
        Math.sin(u * Math.PI * 2 * 5) * 0.035 + Math.sin(u * Math.PI * 2 * 1.3) * 0.02,
      );
    }
    g.computeVertexNormals();
    return g;
  }, [drop]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      position={[x, top - drop / 2, z]}
      rotation={[0, Math.PI / 2, 0]}
      castShadow
    >
      <meshStandardMaterial
        color="#f4efe4"
        transparent
        opacity={0.86}
        roughness={1}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function Ceiling({ room }: { room: RoomDimensions }) {
  const ref = useRef<Group>(null);
  useHideFromOutside(ref, "ceiling", room);
  return (
    <group ref={ref}>
      <mesh position={[0, room.height + WALL / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[room.width + WALL * 2, WALL, room.length + WALL * 2]} />
        <meshStandardMaterial color="#f7f5f0" roughness={0.95} />
      </mesh>
    </group>
  );
}
