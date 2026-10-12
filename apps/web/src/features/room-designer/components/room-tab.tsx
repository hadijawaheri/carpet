"use client";

import type { FloorStyle, RoomLayout, RoomLight, WallSide } from "@farsh/contracts";
import { useState } from "react";

import { formatNumber } from "@/lib/format";

import {
  floorStyleLabels,
  floorSwatches,
  lightLabels,
  wallLabels,
  wallSwatches,
} from "../data/catalog";
import type { RoomAction } from "../state/room-reducer";
import { Choice } from "./choice";
import { ColorField } from "./color-field";
import { RangeField } from "./range-field";

type WallTarget = WallSide | "all";

const lights = (Object.keys(lightLabels) as RoomLight[]).map((value) => ({
  value,
  label: lightLabels[value],
}));
const floorStyles = (Object.keys(floorStyleLabels) as FloorStyle[]).map((value) => ({
  value,
  label: floorStyleLabels[value],
}));

const targets: { value: WallTarget; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "back", label: wallLabels.back },
  { value: "left", label: wallLabels.left },
  { value: "right", label: wallLabels.right },
  { value: "front", label: wallLabels.front },
];

const dimensions = [
  { key: "width", label: "عرض", min: 3, max: 8, step: 0.25 },
  { key: "depth", label: "طول", min: 3, max: 8, step: 0.25 },
  { key: "height", label: "ارتفاع", min: 2.4, max: 3.4, step: 0.1 },
] as const;

interface RoomTabProps {
  layout: RoomLayout;
  dispatch: (action: RoomAction) => void;
}

export function RoomTab({ layout, dispatch }: RoomTabProps) {
  const [target, setTarget] = useState<WallTarget>("all");
  const wallColor = layout.walls[target === "all" ? "back" : target];

  return (
    <>
      <section aria-labelledby="light-title" className="flex flex-col gap-3">
        <h3 id="light-title" className="text-base font-bold">
          نور
        </h3>
        <Choice
          label="زمان روز"
          value={layout.light}
          options={lights}
          onChange={(light) => dispatch({ type: "light", light })}
        />
        <p className="text-accession text-muted-foreground">
          رنگ فرش در آفتاب صبح و زیر نور آباژور فرق می‌کند؛ هر دو را ببینید.
        </p>
      </section>

      <section aria-labelledby="dims-title" className="flex flex-col gap-3">
        <h3 id="dims-title" className="text-base font-bold">
          اندازه‌ی اتاق
        </h3>
        {dimensions.map(({ key, label, min, max, step }) => (
          <RangeField
            key={key}
            label={label}
            valueLabel={`${formatNumber(layout.room[key])} متر`}
            min={min}
            max={max}
            step={step}
            value={layout.room[key]}
            onChange={(next, group) => dispatch({ type: "room", patch: { [key]: next }, group })}
          />
        ))}
      </section>

      <section aria-labelledby="wall-title" className="flex flex-col gap-4">
        <h3 id="wall-title" className="text-base font-bold">
          رنگ دیوارها
        </h3>
        <Choice label="کدام دیوار" value={target} options={targets} onChange={setTarget} />
        <ColorField
          label={target === "all" ? "رنگ همه‌ی دیوارها" : `رنگ ${wallLabels[target]}`}
          value={wallColor}
          swatches={wallSwatches}
          onChange={(color) => dispatch({ type: "wall", side: target, color })}
        />
      </section>

      <section aria-labelledby="floor-title" className="flex flex-col gap-4">
        <h3 id="floor-title" className="text-base font-bold">
          کف
        </h3>
        <Choice
          label="جنس کف"
          value={layout.floorStyle}
          options={floorStyles}
          onChange={(style) => dispatch({ type: "floorStyle", style })}
        />
        <ColorField
          label="رنگ کف"
          value={layout.floor}
          swatches={floorSwatches}
          onChange={(color) => dispatch({ type: "floor", color })}
        />
      </section>
    </>
  );
}
