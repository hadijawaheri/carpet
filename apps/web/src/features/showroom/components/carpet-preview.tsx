"use client";

import type { Carpet } from "@farsh/contracts";
import Image from "next/image";
import { useState } from "react";

import { CarpetStage } from "@/features/carpet-viewer";
import { cn } from "@/lib/utils";

import { MaterialPills } from "./material-pills";

/** Photo or grab-and-shake 3D view of one carpet, with the knot loupe below it. */
export function CarpetPreview({
  carpet,
  imageSizes,
  priority = false,
  className,
}: {
  carpet: Carpet;
  imageSizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [view, setView] = useState<"photo" | "cloth">("photo");
  const [loupe, setLoupe] = useState({ x: 50, y: 50 });

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <MaterialPills
        label="نمای فرش"
        value={view}
        onChange={setView}
        options={[
          { value: "photo", label: "عکس" },
          { value: "cloth", label: "سه‌بعدی، تکانش دهید" },
        ]}
      />
      <div className="relative h-[420px]">
        {view === "photo" ? (
          <Image
            src={carpet.image}
            alt={`فرش ${carpet.name}`}
            fill
            priority={priority}
            sizes={imageSizes}
            className="object-contain drop-shadow-xl"
          />
        ) : (
          <CarpetStage
            carpet={carpet}
            material={carpet.material}
            imageSizes={imageSizes}
            className="size-full"
          />
        )}
      </div>
      <div>
        <p className="eyebrow text-muted-foreground">بررسی گره، نشانگر را روی نوار حرکت دهید</p>
        <div
          role="img"
          aria-label={`نمای نزدیک بافت ${carpet.name}`}
          onPointerMove={(e) => {
            const b = e.currentTarget.getBoundingClientRect();
            setLoupe({
              x: ((e.clientX - b.left) / b.width) * 100,
              y: ((e.clientY - b.top) / b.height) * 100,
            });
          }}
          className="mt-2 h-32 cursor-crosshair touch-none border"
          style={{
            backgroundImage: `url(${carpet.image})`,
            backgroundSize: "900%",
            backgroundPosition: `${loupe.x}% ${loupe.y}%`,
          }}
        />
      </div>
    </div>
  );
}
