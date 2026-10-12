"use client";

import type { PaintingItem, RoomItem, RoomLayout, WallSide } from "@farsh/contracts";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  ImagePlus,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import { useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/lib/format";

import {
  accentSwatches,
  fabricSwatches,
  itemLabels,
  paintingDimensions,
  wallLabels,
  woodSwatches,
} from "../data/catalog";
import { duplicateItem, NUDGE, nudgeItem, type RoomAction } from "../state/room-reducer";
import { Choice } from "./choice";
import { ColorField } from "./color-field";

const TURN = Math.PI / 12;
const wallOptions = (Object.keys(wallLabels) as WallSide[]).map((value) => ({
  value,
  label: wallLabels[value],
}));
const sizeOptions = [
  { value: "s", label: "کوچک" },
  { value: "m", label: "متوسط" },
  { value: "l", label: "بزرگ" },
] as const;

interface ItemInspectorProps {
  item: RoomItem;
  layout: RoomLayout;
  paintingImage: string | undefined;
  dispatch: (action: RoomAction) => void;
  onSelect: (id: string | null) => void;
  onPaintingImage: (id: string, file: File | null) => void;
}

export function itemTitle(item: RoomItem) {
  if (item.kind === "sofa") {
    return item.seats === 1 ? "مبل تک‌نفره" : `مبل ${formatNumber(item.seats)} نفره`;
  }
  return itemLabels[item.kind];
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="mount"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="size-9 border border-input/40"
    >
      {children}
    </Button>
  );
}

/** Everything a visitor can change about the chosen sofa, table, painting or curtain. */
export function ItemInspector({
  item,
  layout,
  paintingImage,
  dispatch,
  onSelect,
  onPaintingImage,
}: ItemInspectorProps) {
  const fileId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const replace = (next: RoomItem) => dispatch({ type: "replace", item: next });
  const nudge = (dx: number, dz: number) => replace(nudgeItem(item, dx, dz));
  const onFloor = item.kind === "sofa" || item.kind === "table";

  const duplicate = () => {
    const copy = duplicateItem(item, layout);
    dispatch({ type: "add", item: copy });
    onSelect(copy.id);
  };

  return (
    <section aria-label={`ویرایش ${itemTitle(item)}`} className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold">{itemTitle(item)}</h3>
        <div className="flex gap-1.5">
          <IconButton label="کپی" onClick={duplicate}>
            <Copy aria-hidden />
          </IconButton>
          <IconButton
            label="حذف"
            onClick={() => {
              dispatch({ type: "remove", id: item.id });
              onSelect(null);
            }}
          >
            <Trash2 aria-hidden />
          </IconButton>
        </div>
      </header>

      {item.kind === "sofa" ? (
        <>
          <Choice
            label="چند نفره"
            value={String(item.seats)}
            options={[1, 2, 3, 4, 5].map((n) => ({
              value: String(n),
              label: n === 1 ? "تک" : formatNumber(n),
            }))}
            onChange={(seats) => replace({ ...item, seats: Number(seats) })}
          />
          <ColorField
            label="رنگ پارچه"
            value={item.color}
            swatches={fabricSwatches}
            onChange={(color) => replace({ ...item, color })}
          />
        </>
      ) : null}

      {item.kind === "table" ? (
        <>
          <Choice
            label="شکل"
            value={item.shape}
            options={[
              { value: "round", label: "گرد" },
              { value: "rect", label: "مستطیل" },
            ]}
            onChange={(shape) => replace({ ...item, shape })}
          />
          <Choice
            label="نوع"
            value={item.height}
            options={[
              { value: "coffee", label: "جلومبلی" },
              { value: "dining", label: "ناهارخوری" },
            ]}
            onChange={(height) => replace({ ...item, height })}
          />
          <Choice
            label="اندازه"
            value={item.size}
            options={[...sizeOptions]}
            onChange={(size) => replace({ ...item, size })}
          />
          <ColorField
            label="رنگ چوب"
            value={item.color}
            swatches={woodSwatches}
            onChange={(color) => replace({ ...item, color })}
          />
        </>
      ) : null}

      {item.kind === "painting" ? (
        <>
          <Choice
            label="دیوار"
            value={item.wall}
            options={wallOptions}
            onChange={(wall) => replace({ ...item, wall })}
          />
          <Choice
            label="اندازه"
            value={item.size}
            options={[...sizeOptions]}
            onChange={(size) => replace({ ...item, size })}
          />
          <Choice
            label="جهت"
            value={item.orientation}
            options={[
              { value: "portrait", label: "ایستاده" },
              { value: "landscape", label: "خوابیده" },
            ]}
            onChange={(orientation) => replace({ ...item, orientation })}
          />
          <PaintingHeight item={item} onChange={(y) => replace({ ...item, y })} />
          <ColorField
            label="رنگ قاب"
            value={item.frameColor}
            swatches={woodSwatches}
            onChange={(frameColor) => replace({ ...item, frameColor })}
          />
          <ColorField
            label="رنگ زمینه‌ی تابلو"
            value={item.fill}
            swatches={fabricSwatches}
            onChange={(fill) => replace({ ...item, fill })}
          />
          <ColorField
            label="رنگ لکه‌ی تابلو"
            value={item.accent}
            swatches={accentSwatches}
            onChange={(accent) => replace({ ...item, accent })}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor={fileId} className="text-label font-semibold">
              عکس خودتان در قاب
            </label>
            <input
              ref={fileInput}
              id={fileId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                onPaintingImage(item.id, event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="mount"
                size="sm"
                className="border border-input/40"
                onClick={() => fileInput.current?.click()}
              >
                <ImagePlus aria-hidden />
                {paintingImage ? "تعویض عکس" : "انتخاب عکس"}
              </Button>
              {paintingImage ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onPaintingImage(item.id, null)}
                >
                  برداشتن عکس
                </Button>
              ) : null}
            </div>
            <p className="text-accession text-muted-foreground">
              عکس فقط روی همین دستگاه می‌ماند و در پیوند اشتراک نمی‌آید.
            </p>
          </div>
        </>
      ) : null}

      {item.kind === "curtain" ? (
        <>
          <Choice
            label="دیوار"
            value={item.wall}
            options={wallOptions}
            onChange={(wall) => replace({ ...item, wall })}
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-label font-semibold">
              <span>پهنای پنجره</span>
              <span className="text-muted-foreground">
                {formatNumber(Math.round(item.width * 100))} سانتی‌متر
              </span>
            </div>
            <Slider
              label="پهنای پنجره"
              min={0.8}
              max={3.2}
              step={0.1}
              value={[item.width]}
              onValueChange={([width]) => width !== undefined && replace({ ...item, width })}
            />
          </div>
          <ColorField
            label="رنگ پرده"
            value={item.color}
            swatches={fabricSwatches}
            onChange={(color) => replace({ ...item, color })}
          />
        </>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-label font-semibold">جابه‌جایی با دکمه</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid grid-cols-3 gap-1" dir="ltr">
            <span />
            {onFloor ? (
              <IconButton label="به عقب" onClick={() => nudge(0, -NUDGE)}>
                <ArrowUp aria-hidden />
              </IconButton>
            ) : item.kind === "painting" ? (
              <IconButton label="بالاتر" onClick={() => nudge(0, -NUDGE)}>
                <ArrowUp aria-hidden />
              </IconButton>
            ) : (
              <span />
            )}
            <span />
            <IconButton label="به چپ" onClick={() => nudge(-NUDGE, 0)}>
              <ArrowLeft aria-hidden />
            </IconButton>
            {onFloor ? (
              <IconButton label="به جلو" onClick={() => nudge(0, NUDGE)}>
                <ArrowDown aria-hidden />
              </IconButton>
            ) : item.kind === "painting" ? (
              <IconButton label="پایین‌تر" onClick={() => nudge(0, NUDGE)}>
                <ArrowDown aria-hidden />
              </IconButton>
            ) : (
              <span />
            )}
            <IconButton label="به راست" onClick={() => nudge(NUDGE, 0)}>
              <ArrowRight aria-hidden />
            </IconButton>
          </div>
          {onFloor ? (
            <div className="flex gap-1.5">
              <IconButton
                label="چرخش ۱۵ درجه به چپ"
                onClick={() => replace({ ...item, rotation: item.rotation + TURN })}
              >
                <RotateCcw aria-hidden />
              </IconButton>
              <IconButton
                label="چرخش ۱۵ درجه به راست"
                onClick={() => replace({ ...item, rotation: item.rotation - TURN })}
              >
                <RotateCw aria-hidden />
              </IconButton>
            </div>
          ) : null}
        </div>
        <p className="text-accession text-muted-foreground">
          جهت‌ها نسبت به نمای کلی اتاق‌اند. با موس هم می‌توانید مستقیم بکشید.
        </p>
      </div>
    </section>
  );
}

function PaintingHeight({ item, onChange }: { item: PaintingItem; onChange: (y: number) => void }) {
  const half = paintingDimensions(item).height / 2;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-label font-semibold">
        <span>ارتفاع مرکز تابلو</span>
        <span className="text-muted-foreground">
          {formatNumber(Math.round(item.y * 100))} سانتی‌متر
        </span>
      </div>
      <Slider
        label="ارتفاع مرکز تابلو"
        min={Math.max(0.6, half + 0.3)}
        max={2.4}
        step={0.05}
        value={[item.y]}
        onValueChange={([y]) => y !== undefined && onChange(y)}
      />
    </div>
  );
}
