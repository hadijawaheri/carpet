"use client";

import type { Carpet } from "@farsh/contracts";
import { useSyncExternalStore } from "react";

import type { RoomConfig } from "../../room/room-config";
import { itemFootprint, type RoomLayout } from "../../room/room-layout";
import type { RugPlacement } from "../../room/rug-placement";

/** A to-scale plan seen from above: the fallback where the browser has no WebGL 2. */
export function RoomPlan({
  config,
  layout,
  carpet,
  placement,
}: {
  config: RoomConfig;
  layout: RoomLayout;
  carpet: Carpet;
  placement: RugPlacement;
}) {
  const spot = useSyncExternalStore(
    placement.subscribe,
    placement.getSnapshot,
    placement.getSnapshot,
  );
  const { width, length } = config;
  const pad = 0.3;
  const rugWidth = carpet.widthCm / 100;
  const rugLength = carpet.lengthCm / 100;
  const angle = spot.quarterTurns * 90;
  return (
    <svg
      viewBox={`${-width / 2 - pad} ${-length / 2 - pad} ${width + pad * 2} ${length + pad * 2}`}
      className="size-full"
      role="img"
      aria-label={`نقشه‌ی اتاق از بالا با فرش ${carpet.name}`}
    >
      <rect
        x={-width / 2}
        y={-length / 2}
        width={width}
        height={length}
        fill={config.wall}
        stroke="currentColor"
        strokeWidth={0.06}
        className="text-foreground"
      />
      <image
        href={carpet.image}
        x={-rugWidth / 2}
        y={-rugLength / 2}
        width={rugWidth}
        height={rugLength}
        preserveAspectRatio="none"
        transform={`translate(${spot.x} ${spot.z}) rotate(${angle})`}
      />
      {layout.furniture.map((item, i) => {
        if (item.kind === "wall-art" || item.kind === "chandelier" || item.kind === "pendant") {
          return null;
        }
        const footprint = itemFootprint(item);
        return (
          <rect
            key={i}
            x={item.x - footprint.width / 2}
            y={item.z - footprint.depth / 2}
            width={footprint.width}
            height={footprint.depth}
            rx={0.05}
            className="fill-card/80 stroke-muted-foreground"
            strokeWidth={0.015}
          />
        );
      })}
    </svg>
  );
}
