"use client";

import type { RoomLayout, WallSide } from "@farsh/contracts";
import { useState } from "react";

import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/lib/format";

import { floorSwatches, wallLabels, wallSwatches } from "../data/catalog";
import type { RoomAction } from "../state/room-reducer";
import { Choice } from "./choice";
import { ColorField } from "./color-field";

type WallTarget = WallSide | "all";

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
      <section aria-labelledby="dims-title" className="flex flex-col gap-3">
        <h3 id="dims-title" className="text-base font-bold">
          اندازه‌ی اتاق
        </h3>
        {dimensions.map(({ key, label, min, max, step }) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-label font-semibold">
              <span>{label}</span>
              <span className="text-muted-foreground">{formatNumber(layout.room[key])} متر</span>
            </div>
            <Slider
              label={label}
              min={min}
              max={max}
              step={step}
              value={[layout.room[key]]}
              onValueChange={([next]) =>
                next !== undefined && dispatch({ type: "room", patch: { [key]: next } })
              }
            />
          </div>
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
