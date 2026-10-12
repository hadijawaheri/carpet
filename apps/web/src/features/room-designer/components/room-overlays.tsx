"use client";

import type { RoomLayout } from "@farsh/contracts";
import { Html, Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { type Footprint, turnedBox, wallGaps } from "../state/room-geometry";

/** Saffron, the site's accent; drawn on top of everything so a selection is never lost behind a sofa. */
export const SELECTION = "#f6c453";

/** Marks scene objects that guide the visitor but must not appear in a saved picture. */
export const OVERLAY = { overlay: true } as const;

/**
 * drei centres a label by shifting it half its width from where it starts. In a right-to-left page it
 * starts at its right edge, so it lands a whole width off; pinning its left edge puts it back on the point.
 */
const ANCHOR = { left: 0 } as const;

const formatCm = (metres: number) =>
  `${Math.max(0, Math.round(metres * 100)).toLocaleString("fa-IR")} سانتی‌متر`;

/** A saffron outline on the floor around a footprint, in the item's own frame. */
export function Outline({ footprint, y = 0.03 }: { footprint: Footprint; y?: number }) {
  const hw = footprint.width / 2 + 0.04;
  const hd = footprint.depth / 2 + 0.04;
  const oz = footprint.offsetZ ?? 0;
  const points: [number, number, number][] = [
    [-hw, y, oz - hd],
    [hw, y, oz - hd],
    [hw, y, oz + hd],
    [-hw, y, oz + hd],
    [-hw, y, oz - hd],
  ];
  return (
    <Line
      points={points}
      color={SELECTION}
      lineWidth={3}
      depthTest={false}
      renderOrder={20}
      userData={OVERLAY}
    />
  );
}

export function WallOutline({ width, height }: { width: number; height: number }) {
  const hw = width / 2 + 0.04;
  const hh = height / 2 + 0.04;
  const points: [number, number, number][] = [
    [-hw, -hh, 0.09],
    [hw, -hh, 0.09],
    [hw, hh, 0.09],
    [-hw, hh, 0.09],
    [-hw, -hh, 0.09],
  ];
  return (
    <Line
      points={points}
      color={SELECTION}
      lineWidth={3}
      depthTest={false}
      renderOrder={20}
      userData={OVERLAY}
    />
  );
}

/** Radius of the turning ring around a footprint: clear of the item, so it can be grabbed. */
export function ringRadius(footprint: Footprint) {
  const box = turnedBox(footprint, 0);
  return Math.hypot(box.hx, box.hz) + 0.18;
}

interface RotateHandleProps {
  footprint: Footprint;
  /** A ring around a large rug would run through the walls, so the rug gets a knob on a short stem instead. */
  compact?: boolean;
  onGrab: (event: ThreeEvent<PointerEvent>) => void;
}

/**
 * A knob in front of the item, on a ring round it. Dragging the knob turns the piece freely;
 * it settles on the nearest 15° when close to one. Drawn in the item's turned frame.
 */
export function RotateHandle({ footprint, compact = false, onGrab }: RotateHandleProps) {
  const oz = footprint.offsetZ ?? 0;
  const edge = footprint.depth / 2;
  const radius = compact ? edge + 0.32 : ringRadius(footprint);
  return (
    <group position={[0, 0.035, oz]} userData={OVERLAY}>
      {compact ? (
        <Line
          points={[
            [0, 0, edge + 0.04],
            [0, 0, radius],
          ]}
          color={SELECTION}
          lineWidth={2}
          depthTest={false}
          renderOrder={21}
          userData={OVERLAY}
        />
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={21} userData={OVERLAY}>
          <ringGeometry args={[radius - 0.012, radius + 0.012, 96]} />
          <meshBasicMaterial
            color={SELECTION}
            transparent
            opacity={0.75}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
      )}
      <group position={[0, 0, radius]}>
        <mesh renderOrder={22} userData={OVERLAY}>
          <sphereGeometry args={[0.055, 24, 16]} />
          <meshBasicMaterial color={SELECTION} depthTest={false} toneMapped={false} />
        </mesh>
        {/* A larger invisible target, so a finger can catch the knob. */}
        <mesh
          userData={OVERLAY}
          onPointerDown={onGrab}
          onPointerOver={() => {
            document.body.style.cursor = "grab";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <sphereGeometry args={[0.16, 12, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function Tape({
  from,
  to,
  label,
}: {
  from: [number, number, number];
  to: [number, number, number];
  label: string;
}) {
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, from[1], (from[2] + to[2]) / 2];
  return (
    <group userData={OVERLAY}>
      <Line
        points={[from, to]}
        color={SELECTION}
        lineWidth={1.5}
        dashed
        dashSize={0.06}
        gapSize={0.04}
        depthTest={false}
        renderOrder={19}
        userData={OVERLAY}
      />
      <Html
        position={mid}
        center
        zIndexRange={[15, 0]}
        style={{ ...ANCHOR, pointerEvents: "none" }}
      >
        <span className="rounded-sm bg-card px-1.5 py-0.5 text-[11px] whitespace-nowrap text-card-foreground tabular-nums shadow-sm">
          {label}
        </span>
      </Html>
    </group>
  );
}

/**
 * Tape measures from a floor item to the nearest wall on each axis, in room coordinates:
 * what a buyer checks before ordering a size.
 */
export function Measurements({
  room,
  x,
  z,
  footprint,
  rotation,
}: {
  room: RoomLayout["room"];
  x: number;
  z: number;
  footprint: Footprint;
  rotation: number;
}) {
  const gaps = wallGaps(room, x, z, footprint, rotation);
  const { cx, cz, hx, hz } = gaps.box;
  const y = 0.04;
  const toLeft = gaps.left <= gaps.right;
  const toBack = gaps.back <= gaps.front;
  const sideGap = toLeft ? gaps.left : gaps.right;
  const depthGap = toBack ? gaps.back : gaps.front;
  return (
    <group userData={OVERLAY}>
      {sideGap > 0.03 ? (
        <Tape
          from={[toLeft ? cx - hx : cx + hx, y, cz]}
          to={[toLeft ? -room.width / 2 : room.width / 2, y, cz]}
          label={formatCm(sideGap)}
        />
      ) : null}
      {depthGap > 0.03 ? (
        <Tape
          from={[cx, y, toBack ? cz - hz : cz + hz]}
          to={[cx, y, toBack ? -room.depth / 2 : room.depth / 2]}
          label={formatCm(depthGap)}
        />
      ) : null}
    </group>
  );
}

export interface ToolbarAction {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** Directional icons mirror in RTL. */
  directional?: boolean;
}

/** A small bar of actions that floats above the selected piece. */
export function ItemToolbar({
  position,
  actions,
}: {
  position: [number, number, number];
  actions: ToolbarAction[];
}) {
  return (
    <Html position={position} center zIndexRange={[30, 0]} style={ANCHOR}>
      <div
        role="toolbar"
        aria-label="کارهای این وسیله"
        className="flex items-center gap-0.5 rounded-md bg-card p-1 text-card-foreground shadow-lg"
        onPointerDown={(event) => event.stopPropagation()}
      >
        {actions.map(({ label, icon: Icon, onSelect, directional }) => (
          <Button
            key={label}
            variant="mount"
            size="icon"
            className="size-9"
            aria-label={label}
            title={label}
            onClick={onSelect}
          >
            <Icon className={directional ? "rtl:rotate-180" : undefined} />
          </Button>
        ))}
      </div>
    </Html>
  );
}
