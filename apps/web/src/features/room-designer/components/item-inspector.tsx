"use client";

import type {
  Carpet,
  CurtainItem,
  FloorItem,
  PaintingItem,
  RoomItem,
  RoomLayout,
  WallItem,
  WallSide,
} from "@farsh/contracts";
import { isFloorItem } from "@farsh/contracts";
import { Copy, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  accentSwatches,
  fabricSwatches,
  frameDefaults,
  frameSwatches,
  itemLabels,
  metalSwatches,
  paintingDimensions,
  potSwatches,
  wallLabels,
  woodSwatches,
} from "../data/catalog";
import { type AspectOf, wallFrame } from "../state/room-geometry";
import { aspectLookup, duplicateItem, type RoomAction } from "../state/room-reducer";
import { Choice } from "./choice";
import { ColorField } from "./color-field";
import { RangeField, toDegrees, toRadians } from "./range-field";

const wallOptions = (Object.keys(wallLabels) as WallSide[]).map((value) => ({
  value,
  label: wallLabels[value],
}));
const sizeOptions = [
  { value: "s", label: "کوچک" },
  { value: "m", label: "متوسط" },
  { value: "l", label: "بزرگ" },
] as const;
const cm = (metres: number) => `${formatNumber(Math.round(metres * 100))} سانتی‌متر`;

type Replace = (next: RoomItem, group?: string) => void;

interface ItemInspectorProps {
  item: RoomItem;
  layout: RoomLayout;
  carpets: Carpet[];
  paintingImage: string | undefined;
  dispatch: (action: RoomAction) => void;
  onSelect: (id: string | null) => void;
  onPaintingImage: (id: string, file: File | null) => void;
}

export function itemTitle(item: RoomItem) {
  switch (item.kind) {
    case "sofa":
      return item.seats === 1 ? "مبل تک‌نفره" : `مبل ${formatNumber(item.seats)} نفره`;
    case "table":
      return { coffee: "میز جلومبلی", side: "میز عسلی", dining: "میز ناهارخوری" }[item.height];
    case "cabinet":
      return { console: "کنسول", tv: "میز تلویزیون", bookcase: "کتابخانه" }[item.variant];
    case "painting":
      return item.art === "carpet" ? "تابلو فرش" : "تابلو";
    default:
      return itemLabels[item.kind];
  }
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 border-t border-border pt-4">
      <h4 id={id} className="text-label font-bold text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

/** Everything a visitor can change about the chosen piece. */
export function ItemInspector({
  item,
  layout,
  carpets,
  paintingImage,
  dispatch,
  onSelect,
  onPaintingImage,
}: ItemInspectorProps) {
  const replace: Replace = (next, group) => dispatch({ type: "replace", item: next, group });
  const aspectOf = aspectLookup(carpets);

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
          <IconButton label="تکثیر" onClick={duplicate}>
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

      <KindFields
        item={item}
        carpets={carpets}
        paintingImage={paintingImage}
        replace={replace}
        onPaintingImage={onPaintingImage}
      />

      {isFloorItem(item) ? (
        <FloorPlacement item={item} room={layout.room} replace={replace} />
      ) : (
        <WallPlacement item={item} room={layout.room} aspectOf={aspectOf} replace={replace} />
      )}
    </section>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
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

function KindFields({
  item,
  carpets,
  paintingImage,
  replace,
  onPaintingImage,
}: {
  item: RoomItem;
  carpets: Carpet[];
  paintingImage: string | undefined;
  replace: Replace;
  onPaintingImage: (id: string, file: File | null) => void;
}) {
  switch (item.kind) {
    case "sofa":
      return (
        <>
          <Choice
            label="سبک"
            value={item.style}
            options={[
              { value: "modern", label: "مدرن" },
              { value: "classic", label: "کلاسیک" },
            ]}
            onChange={(style) => replace({ ...item, style })}
          />
          <Choice
            label="چند نفره"
            value={String(item.seats)}
            options={[1, 2, 3, 4, 5].map((n) => ({
              value: String(n),
              label: n === 1 ? "تک" : formatNumber(n),
            }))}
            onChange={(seats) =>
              replace({
                ...item,
                seats: Number(seats),
                chaise: seats === "1" ? "none" : item.chaise,
              })
            }
          />
          {item.seats > 1 ? (
            <Choice
              label="کاناپه‌ی ال"
              value={item.chaise}
              options={[
                { value: "none", label: "ندارد" },
                { value: "right", label: "سمت راست" },
                { value: "left", label: "سمت چپ" },
              ]}
              onChange={(chaise) => replace({ ...item, chaise })}
            />
          ) : null}
          <ColorField
            label="رنگ پارچه"
            value={item.color}
            swatches={fabricSwatches}
            onChange={(color) => replace({ ...item, color })}
          />
          <ColorField
            label="رنگ پایه‌ها"
            value={item.legColor}
            swatches={woodSwatches}
            onChange={(legColor) => replace({ ...item, legColor })}
          />
        </>
      );
    case "table":
      return (
        <>
          <Choice
            label="نوع"
            value={item.height}
            options={[
              { value: "coffee", label: "جلومبلی" },
              { value: "side", label: "عسلی" },
              { value: "dining", label: "ناهارخوری" },
            ]}
            onChange={(height) =>
              replace({
                ...item,
                height,
                chairs: height === "dining" && item.chairs === 0 ? 4 : item.chairs,
              })
            }
          />
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
          {item.height === "dining" ? (
            <>
              <RangeField
                label="صندلی‌ها"
                valueLabel={item.chairs === 0 ? "بدون صندلی" : `${formatNumber(item.chairs)} صندلی`}
                min={0}
                max={8}
                step={1}
                value={item.chairs}
                onChange={(chairs, group) => replace({ ...item, chairs }, group)}
              />
              {item.chairs > 0 ? (
                <ColorField
                  label="رنگ صندلی‌ها"
                  value={item.chairColor}
                  swatches={fabricSwatches}
                  onChange={(chairColor) => replace({ ...item, chairColor })}
                />
              ) : null}
            </>
          ) : null}
        </>
      );
    case "lamp":
      return (
        <>
          <Choice
            label="چراغ"
            value={item.lit ? "on" : "off"}
            options={[
              { value: "on", label: "روشن" },
              { value: "off", label: "خاموش" },
            ]}
            onChange={(lit) => replace({ ...item, lit: lit === "on" })}
          />
          <ColorField
            label="رنگ کلاهک"
            value={item.color}
            swatches={fabricSwatches}
            onChange={(color) => replace({ ...item, color })}
          />
          <ColorField
            label="رنگ پایه"
            value={item.metal}
            swatches={metalSwatches}
            onChange={(metal) => replace({ ...item, metal })}
          />
          <p className="text-accession text-muted-foreground">
            نور آباژور در حالت غروب و شب پیدا است؛ از بخش «اتاق» زمان روز را عوض کنید.
          </p>
        </>
      );
    case "plant":
      return (
        <>
          <Choice
            label="اندازه"
            value={item.size}
            options={[...sizeOptions]}
            onChange={(size) => replace({ ...item, size })}
          />
          <ColorField
            label="رنگ گلدان"
            value={item.potColor}
            swatches={potSwatches}
            onChange={(potColor) => replace({ ...item, potColor })}
          />
        </>
      );
    case "cabinet":
      return (
        <>
          <Choice
            label="نوع"
            value={item.variant}
            options={[
              { value: "console", label: "کنسول" },
              { value: "tv", label: "میز تلویزیون" },
              { value: "bookcase", label: "کتابخانه" },
            ]}
            onChange={(variant) => replace({ ...item, variant })}
          />
          <RangeField
            label="پهنا"
            valueLabel={cm(item.width)}
            min={0.6}
            max={2.6}
            step={0.05}
            value={item.width}
            onChange={(width, group) => replace({ ...item, width }, group)}
          />
          <ColorField
            label="رنگ چوب"
            value={item.color}
            swatches={woodSwatches}
            onChange={(color) => replace({ ...item, color })}
          />
        </>
      );
    case "pouf":
      return (
        <>
          <Choice
            label="شکل"
            value={item.shape}
            options={[
              { value: "round", label: "گرد" },
              { value: "square", label: "چهارگوش" },
            ]}
            onChange={(shape) => replace({ ...item, shape })}
          />
          <ColorField
            label="رنگ پارچه"
            value={item.color}
            swatches={fabricSwatches}
            onChange={(color) => replace({ ...item, color })}
          />
        </>
      );
    case "painting":
      return (
        <PaintingFields
          item={item}
          carpets={carpets}
          paintingImage={paintingImage}
          replace={replace}
          onPaintingImage={onPaintingImage}
        />
      );
    case "curtain":
      return <CurtainFields item={item} replace={replace} />;
  }
}

function PaintingFields({
  item,
  carpets,
  paintingImage,
  replace,
  onPaintingImage,
}: {
  item: PaintingItem;
  carpets: Carpet[];
  paintingImage: string | undefined;
  replace: Replace;
  onPaintingImage: (id: string, file: File | null) => void;
}) {
  const fileId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const tableaux = carpets.filter((c) => c.kind === "tableau");
  // Until the owner adds tableau photos, his rug photos stand in, and the panel says so.
  const choices = tableaux.length > 0 ? tableaux : carpets;

  return (
    <>
      <Choice
        label="داخل قاب"
        value={item.art}
        options={[
          { value: "carpet", label: "تابلو فرش" },
          { value: "colors", label: "نقش رنگی" },
          { value: "photo", label: "عکس خودتان" },
        ]}
        onChange={(art) =>
          replace({
            ...item,
            art,
            carpet: art === "carpet" ? (item.carpet ?? choices[0]?.slug) : item.carpet,
          })
        }
      />

      {item.art === "carpet" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-label font-semibold">کدام تابلو</legend>
          <div className="grid grid-cols-5 gap-2">
            {choices.map((option) => {
              const selected = option.slug === item.carpet;
              return (
                <button
                  key={option.slug}
                  type="button"
                  aria-pressed={selected}
                  aria-label={option.name}
                  title={option.name}
                  onClick={() => replace({ ...item, carpet: option.slug })}
                  className={cn(
                    "relative aspect-[3/4] cursor-pointer overflow-hidden rounded-sm border border-input/40 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    selected && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                  )}
                >
                  <Image src={option.image} alt="" fill sizes="64px" className="object-cover" />
                </button>
              );
            })}
          </div>
          {tableaux.length === 0 ? (
            <p className="text-accession text-muted-foreground">
              عکس تابلو فرش‌ها هنوز اضافه نشده؛ فعلاً عکس فرش‌های مجموعه در قاب است.
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <Choice
        label="اندازه"
        value={item.size}
        options={[...sizeOptions]}
        onChange={(size) => replace({ ...item, size })}
      />
      {item.art !== "carpet" ? (
        <Choice
          label="جهت"
          value={item.orientation}
          options={[
            { value: "portrait", label: "ایستاده" },
            { value: "landscape", label: "خوابیده" },
          ]}
          onChange={(orientation) => replace({ ...item, orientation })}
        />
      ) : null}
      <Choice
        label="قاب"
        value={item.frame}
        options={[
          { value: "thin", label: "باریک" },
          { value: "wood", label: "چوبی" },
          { value: "gold", label: "طلایی" },
          { value: "none", label: "بدون قاب" },
        ]}
        onChange={(frame) => replace({ ...item, frame, frameColor: frameDefaults[frame] })}
      />
      {item.frame !== "none" ? (
        <ColorField
          label="رنگ قاب"
          value={item.frameColor}
          swatches={frameSwatches}
          onChange={(frameColor) => replace({ ...item, frameColor })}
        />
      ) : null}

      {item.art === "colors" ? (
        <>
          <ColorField
            label="رنگ زمینه"
            value={item.fill}
            swatches={fabricSwatches}
            onChange={(fill) => replace({ ...item, fill })}
          />
          <ColorField
            label="رنگ نقش"
            value={item.accent}
            swatches={accentSwatches}
            onChange={(accent) => replace({ ...item, accent })}
          />
        </>
      ) : null}

      {item.art === "photo" ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={fileId} className="text-label font-semibold">
            عکس شما
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
      ) : null}
    </>
  );
}

function CurtainFields({ item, replace }: { item: CurtainItem; replace: Replace }) {
  return (
    <>
      <Choice
        label="پارچه"
        value={item.fabric}
        options={[
          { value: "heavy", label: "پرده‌ی ضخیم" },
          { value: "sheer", label: "حریر" },
        ]}
        onChange={(fabric) => replace({ ...item, fabric })}
      />
      <RangeField
        label="پهنای پنجره"
        valueLabel={cm(item.width)}
        min={0.8}
        max={3.2}
        step={0.05}
        value={item.width}
        onChange={(width, group) => replace({ ...item, width }, group)}
      />
      <ColorField
        label="رنگ پرده"
        value={item.color}
        swatches={fabricSwatches}
        onChange={(color) => replace({ ...item, color })}
      />
    </>
  );
}

function FloorPlacement({
  item,
  room,
  replace,
}: {
  item: FloorItem;
  room: RoomLayout["room"];
  replace: Replace;
}) {
  return (
    <Group title="جا و جهت">
      <RangeField
        label="چپ و راست"
        valueLabel={cm(item.x)}
        dir="ltr"
        min={-room.width / 2}
        max={room.width / 2}
        step={0.01}
        value={item.x}
        onChange={(x, group) => replace({ ...item, x }, group)}
      />
      <RangeField
        label="عقب و جلو"
        valueLabel={cm(item.z)}
        dir="ltr"
        min={-room.depth / 2}
        max={room.depth / 2}
        step={0.01}
        value={item.z}
        onChange={(z, group) => replace({ ...item, z }, group)}
      />
      <RangeField
        label="زاویه"
        valueLabel={`${formatNumber(toDegrees(item.rotation))} درجه`}
        min={-180}
        max={180}
        step={1}
        value={toDegrees(item.rotation)}
        onChange={(degrees, group) => replace({ ...item, rotation: toRadians(degrees) }, group)}
      />
      <p className="text-accession text-muted-foreground">
        در اتاق هم می‌شود وسیله را کشید، و با دایره‌ی زرد دورش آزادانه چرخاند.
      </p>
    </Group>
  );
}

function WallPlacement({
  item,
  room,
  aspectOf,
  replace,
}: {
  item: WallItem;
  room: RoomLayout["room"];
  aspectOf: AspectOf;
  replace: Replace;
}) {
  const length = wallFrame(item.wall, room).length;
  const half =
    item.kind === "painting" ? paintingDimensions(item, aspectOf(item.carpet)).height / 2 : 0;
  return (
    <Group title="جا روی دیوار">
      <Choice
        label="دیوار"
        value={item.wall}
        options={wallOptions}
        onChange={(wall) => replace({ ...item, wall })}
      />
      <RangeField
        label="جا در طول دیوار"
        valueLabel={cm(item.along)}
        dir="ltr"
        min={-length / 2}
        max={length / 2}
        step={0.01}
        value={item.along}
        onChange={(along, group) => replace({ ...item, along }, group)}
      />
      {item.kind === "painting" ? (
        <RangeField
          label="ارتفاع مرکز از زمین"
          valueLabel={cm(item.y)}
          min={Math.max(0.4, half + 0.15)}
          max={Math.min(2.6, room.height - half - 0.08)}
          step={0.01}
          value={item.y}
          onChange={(y, group) => replace({ ...item, y }, group)}
        />
      ) : null}
      <p className="text-accession text-muted-foreground">
        در اتاق هم می‌شود {item.kind === "painting" ? "تابلو" : "پنجره"} را کشید و تا دیوار کناری
        برد.
      </p>
    </Group>
  );
}
