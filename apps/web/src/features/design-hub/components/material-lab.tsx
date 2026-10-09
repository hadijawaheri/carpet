"use client";

import { type Carpet, materialPresets, type PileMaterial } from "@farsh/contracts";
import { useState } from "react";

import { CarpetStage, materialLabels, MaterialToggle } from "@/features/carpet-viewer";
import { cn } from "@/lib/utils";

const order: PileMaterial[] = ["silk", "wool", "machine"];

const rows: { label: string; hint: string; value: (m: PileMaterial) => number }[] = [
  { label: "سفتی خمش", hint: "bend", value: (m) => materialPresets[m].physics.bendStiffness },
  { label: "دور حل قید", hint: "iterations", value: (m) => materialPresets[m].physics.iterations },
  { label: "میرایی", hint: "damping", value: (m) => materialPresets[m].physics.damping },
  {
    label: "بازگشت به حالت صاف",
    hint: "restore",
    value: (m) => materialPresets[m].physics.restore,
  },
  { label: "زبری", hint: "roughness", value: (m) => materialPresets[m].surface.roughness },
  { label: "درخشش پرز", hint: "sheen", value: (m) => materialPresets[m].surface.sheen },
  {
    label: "ناهمسانی برق",
    hint: "anisotropy",
    value: (m) => materialPresets[m].surface.anisotropy,
  },
];

export function MaterialLab({ carpet }: { carpet: Carpet }) {
  const [material, setMaterial] = useState<PileMaterial>("silk");

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-4">
        <CarpetStage
          carpet={carpet}
          material={material}
          className="h-[60dvh] min-h-80 w-full rounded-lg bg-muted"
        />
        <MaterialToggle value={material} onValueChange={setMaterial} />
      </div>
      <table className="w-full self-start text-spec">
        <caption className="mb-4 text-start text-label text-muted-foreground">
          پیش‌تنظیم‌ها با دست و چشم تنظیم شده‌اند، نه با اندازه‌گیری فرش واقعی.
        </caption>
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="py-2 pe-3 text-start font-semibold">ویژگی</th>
            {order.map((m) => (
              <th
                key={m}
                className={cn(
                  "py-2 pe-3 text-start font-semibold transition-colors",
                  m === material ? "text-brand-text" : "text-muted-foreground",
                )}
              >
                {materialLabels[m]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.hint} className="border-b border-border">
              <th scope="row" className="py-2.5 pe-3 text-start font-normal">
                {r.label}
                <span className="block font-mono text-xs text-muted-foreground">
                  <span dir="ltr">{r.hint}</span>
                </span>
              </th>
              {order.map((m) => (
                <td
                  key={m}
                  dir="ltr"
                  className={cn(
                    "py-2.5 pe-3 text-end font-mono tabular-nums transition-colors",
                    m === material ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {r.value(m)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
