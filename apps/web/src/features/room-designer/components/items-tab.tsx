"use client";

import {
  type Carpet,
  MAX_ROOM_ITEMS,
  type RoomItem,
  type RoomItemKind,
  type RoomLayout,
} from "@farsh/contracts";
import { Archive, Blinds, Cylinder, Frame, LampFloor, Sofa, Sprout, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { itemLabels } from "../data/catalog";
import { createItem, type RoomAction } from "../state/room-reducer";
import { ItemInspector, itemTitle } from "./item-inspector";

const kinds: { kind: RoomItemKind; icon: typeof Sofa }[] = [
  { kind: "sofa", icon: Sofa },
  { kind: "table", icon: Table2 },
  { kind: "pouf", icon: Cylinder },
  { kind: "cabinet", icon: Archive },
  { kind: "lamp", icon: LampFloor },
  { kind: "plant", icon: Sprout },
  { kind: "painting", icon: Frame },
  { kind: "curtain", icon: Blinds },
];

/** The colour a piece is known by in the list. */
function itemColor(item: RoomItem) {
  switch (item.kind) {
    case "plant":
      return item.potColor;
    case "painting":
      return item.art === "colors" ? item.accent : item.frameColor;
    default:
      return item.color;
  }
}

interface ItemsTabProps {
  layout: RoomLayout;
  carpets: Carpet[];
  selectedId: string | null;
  paintingImages: Record<string, string>;
  dispatch: (action: RoomAction) => void;
  onSelect: (id: string | null) => void;
  onPaintingImage: (id: string, file: File | null) => void;
}

export function ItemsTab({
  layout,
  carpets,
  selectedId,
  paintingImages,
  dispatch,
  onSelect,
  onPaintingImage,
}: ItemsTabProps) {
  const selected = layout.items.find((item) => item.id === selectedId);
  const full = layout.items.length >= MAX_ROOM_ITEMS;

  return (
    <>
      <section aria-labelledby="add-title" className="flex flex-col gap-3">
        <h3 id="add-title" className="text-base font-bold">
          به اتاق اضافه کنید
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {kinds.map(({ kind, icon: Icon }) => (
            <Button
              key={kind}
              type="button"
              variant="mount"
              disabled={full}
              className="h-auto flex-col gap-1 border border-input/40 px-1 py-3 text-xs"
              onClick={() => {
                const item = createItem(kind, layout);
                dispatch({ type: "add", item });
                onSelect(item.id);
              }}
            >
              <Icon aria-hidden className="size-5" />
              {itemLabels[kind]}
            </Button>
          ))}
        </div>
        {full ? (
          <p className="text-label text-destructive" role="status">
            اتاق پر است؛ برای افزودن، چیزی را حذف کنید.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="list-title" className="flex flex-col gap-3">
        <h3 id="list-title" className="flex items-baseline justify-between text-base font-bold">
          در اتاق
          <span className="text-label font-normal text-muted-foreground">
            {formatNumber(layout.items.length)} از {formatNumber(MAX_ROOM_ITEMS)}
          </span>
        </h3>
        {layout.items.length === 0 ? (
          <p className="text-label text-muted-foreground">هنوز چیزی در اتاق نگذاشته‌اید.</p>
        ) : (
          <ul className="grid gap-1">
            {layout.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={item.id === selectedId}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm border border-transparent px-3 py-2 text-start text-sm font-semibold outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring",
                    item.id === selectedId && "border-primary bg-secondary",
                  )}
                >
                  {itemTitle(item)}
                  <span
                    aria-hidden
                    className="size-4 rounded-full border border-input/40"
                    style={{ backgroundColor: itemColor(item) }}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected ? (
        <ItemInspector
          key={selected.id}
          item={selected}
          layout={layout}
          carpets={carpets}
          paintingImage={paintingImages[selected.id]}
          dispatch={dispatch}
          onSelect={onSelect}
          onPaintingImage={onPaintingImage}
        />
      ) : layout.items.length > 0 ? (
        <p className="text-label text-muted-foreground">
          یکی را از فهرست یا از خود اتاق انتخاب کنید تا رنگ و اندازه‌اش را تغییر دهید.
        </p>
      ) : null}
    </>
  );
}
