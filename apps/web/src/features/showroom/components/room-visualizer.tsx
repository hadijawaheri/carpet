"use client";

import {
  BedDouble,
  Briefcase,
  Eye,
  ImageDown,
  Landmark,
  LocateFixed,
  type LucideIcon,
  Map as MapIcon,
  Moon,
  PersonStanding,
  RotateCw,
  Sofa,
  Sun,
  Sunset,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import { ToggleGroup } from "radix-ui";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import {
  assessFit,
  clampDimension,
  dimensionLimits,
  type FitStatus,
  type FloorKind,
  floorKinds,
  layoutRoom,
  type LightMode,
  lightModes,
  presetConfig,
  type RoomConfig,
  type RoomDimensions,
  RoomStage,
  type RoomType,
  roomTypeOrder,
  roomTypes,
  type RoomView,
  RugPlacement,
  wallPaints,
} from "@/features/carpet-viewer";
import { formatNumber, formatSizeCm } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useShowroom } from "./showroom-store";

const roomIcons: Record<RoomType, LucideIcon> = {
  living: Sofa,
  salon: Landmark,
  bedroom: BedDouble,
  dining: UtensilsCrossed,
  office: Briefcase,
};

const lightIcons: Record<LightMode, LucideIcon> = { day: Sun, golden: Sunset, night: Moon };

const views: { value: RoomView; label: string; icon: LucideIcon }[] = [
  { value: "overview", label: "نمای کلی", icon: Eye },
  { value: "eye", label: "ایستاده در اتاق", icon: PersonStanding },
  { value: "top", label: "از بالا", icon: MapIcon },
];

const dimensionLabels: Record<keyof RoomDimensions, string> = {
  width: "عرض",
  length: "طول",
  height: "ارتفاع سقف",
};

const fitCopy: Record<FitStatus, { title: string; advice: string }> = {
  balanced: {
    title: "اندازه‌ی متناسب",
    advice:
      "فرش جای نشستن را مشخص می‌کند و دور تا دورش نوار کف پیداست؛ همان چیزی که طراحان داخلی توصیه می‌کنند.",
  },
  tight: {
    title: "تقریباً دیوار به دیوار",
    advice: "کمتر از ۲۰ سانتی‌متر کف دیده می‌شود. حاشیه‌ی ۳۰ تا ۶۰ سانتی‌متری معمولاً زیباتر است.",
  },
  small: {
    title: "برای این فضا کوچک است",
    advice: "فرش بزرگ‌تر یا یک جفت فرش هم‌اندازه این فضا را بهتر پر می‌کند.",
  },
  "too-big": {
    title: "از اتاق بزرگ‌تر است",
    advice: "این فرش در این ابعاد جا نمی‌شود؛ اتاق را بزرگ‌تر کنید یا فرش دیگری انتخاب کنید.",
  },
};

const NUDGE = 0.1;

const formatMetres = (value: number) => `${formatNumber(Math.round(value * 10) / 10)} متر`;

export function RoomVisualizer() {
  const { carpets, addToSelection } = useShowroom();
  const [config, setConfig] = useState<RoomConfig>(() => presetConfig("living"));
  // Opens on the largest carpet: a room preview is about how much floor a carpet holds.
  const [slug, setSlug] = useState(
    () =>
      [...carpets].sort((a, b) => b.widthCm * b.lengthCm - a.widthCm * a.lengthCm)[0]?.slug ?? "",
  );
  const [view, setView] = useState<RoomView>("overview");
  const [viewToken, setViewToken] = useState(0);
  const placement = useMemo(() => new RugPlacement(), []);
  const capture = useRef<(() => string) | null>(null);
  const carpet = carpets.find((c) => c.slug === slug) ?? carpets[0];

  const layout = useMemo(
    () =>
      layoutRoom(config.type, {
        width: config.width,
        length: config.length,
        height: config.height,
      }),
    [config.type, config.width, config.length, config.height],
  );
  const rugWidth = carpet ? carpet.widthCm / 100 : 0;
  const rugLength = carpet ? carpet.lengthCm / 100 : 0;
  const rug = { width: rugWidth, length: rugLength };

  // A new room, size or carpet starts from the spot a designer would choose.
  useEffect(() => {
    placement.reset(
      { width: config.width, length: config.length },
      { width: rugWidth, length: rugLength },
      layout.rug,
    );
  }, [placement, layout, config.width, config.length, rugWidth, rugLength]);

  const spot = useSyncExternalStore(
    placement.subscribe,
    placement.getSnapshot,
    placement.getSnapshot,
  );
  if (!carpet) return null;

  const fit = assessFit(
    { width: config.width, length: config.length },
    rug,
    spot.quarterTurns,
    spot,
    roomTypes[config.type].minCoverage,
  );
  const minGap = Math.max(0, Math.min(fit.gaps.start, fit.gaps.end, fit.gaps.back, fit.gaps.front));
  const limits = dimensionLimits(config.type);

  const update = (patch: Partial<RoomConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const chooseView = (next: RoomView) => {
    setView(next);
    setViewToken((t) => t + 1);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowRight: [NUDGE, 0],
      ArrowLeft: [-NUDGE, 0],
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      placement.nudge(move[0], move[1]);
    } else if (event.key === "r" || event.key === "R" || event.key === "ر") {
      placement.rotate();
    }
  };
  const saveImage = () => {
    const url = capture.current?.();
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `farsh-${carpet.slug}-${config.type}.jpg`;
    link.click();
  };

  return (
    <section id="visualizer" className="scroll-mt-24 bg-alabaster linen py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="eyebrow text-gold-text">پیش‌نمایش اتاق</p>
        <h2 className="mt-3 text-4xl md:text-5xl">فرش را در خانه‌ی خودتان ببینید</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          اتاق را هم‌اندازه‌ی خانه‌تان کنید، رنگ دیوار و کف و نور را انتخاب کنید؛ فرش با ابعاد
          واقعی‌اش روی زمین پهن می‌شود و می‌توانید جابه‌جا و چرخانده‌اش کنید.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
            <div
              className="relative h-[420px] overflow-hidden bg-muted shadow-lift outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-[520px] lg:h-[min(620px,calc(100dvh-16rem))]"
              tabIndex={0}
              role="group"
              aria-label={`پیش‌نمایش سه‌بعدی ${roomTypes[config.type].label} با فرش ${carpet.name}. با کلیدهای جهت فرش را جابه‌جا کنید و با R بچرخانید.`}
              onKeyDown={handleKeyDown}
              data-testid="room-stage"
              data-rug-x={spot.x.toFixed(2)}
              data-rug-z={spot.z.toFixed(2)}
              data-rug-turns={spot.quarterTurns}
            >
              <RoomStage
                config={config}
                layout={layout}
                carpet={carpet}
                material={carpet.material}
                placement={placement}
                view={view}
                viewToken={viewToken}
                onCaptureReady={(fn) => (capture.current = fn)}
              />
              <ToggleGroup.Root
                type="single"
                value={view}
                onValueChange={(next) => next && chooseView(next as RoomView)}
                aria-label="زاویه‌ی دید"
                className="absolute start-3 top-3 flex gap-1 rounded-full bg-background/85 p-1 shadow-lift backdrop-blur"
              >
                {views.map(({ value, label, icon: Icon }) => (
                  <ToggleGroup.Item
                    key={value}
                    value={value}
                    onClick={() => value === view && chooseView(value)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    <Icon className="size-3.5" aria-hidden />
                    <span className="max-sm:sr-only">{label}</span>
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup.Root>
              <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1 rounded-full bg-background/85 p-1 shadow-lift backdrop-blur">
                  <StageButton
                    icon={RotateCw}
                    label="چرخاندن ۹۰ درجه"
                    onClick={() => placement.rotate()}
                  />
                  <StageButton
                    icon={LocateFixed}
                    label="جای پیشنهادی"
                    onClick={() =>
                      placement.reset(
                        { width: config.width, length: config.length },
                        rug,
                        layout.rug,
                      )
                    }
                  />
                  <StageButton icon={ImageDown} label="ذخیره‌ی تصویر" onClick={saveImage} />
                </div>
                <p className="rounded-full bg-background/85 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur max-md:hidden">
                  فرش را بکشید تا جابه‌جا شود · بیرون از فرش بکشید تا نما بچرخد · چرخ موس برای نزدیک
                  شدن
                </p>
              </div>
            </div>
            <FitReadout
              status={fit.status}
              coverage={fit.coverage}
              minGap={minGap}
              room={config}
              carpetSize={formatSizeCm(carpet.widthCm, carpet.lengthCm)}
              onAsk={() => addToSelection(carpet, { ask: true })}
            />
          </div>

          <div className="flex flex-col gap-8">
            <Fieldset legend="فرش">
              <div className="grid grid-cols-5 gap-2">
                {carpets.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    aria-label={c.name}
                    aria-pressed={carpet.slug === c.slug}
                    onClick={() => setSlug(c.slug)}
                    className={cn(
                      "relative aspect-[3/4] cursor-pointer overflow-hidden border-2 transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      carpet.slug === c.slug
                        ? "border-gold"
                        : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <Image src={c.image} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
              <p className="mt-3 font-display text-xl">{carpet.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatSizeCm(carpet.widthCm, carpet.lengthCm)}
              </p>
            </Fieldset>

            <Fieldset legend="فضا">
              <div className="grid grid-cols-2 gap-2">
                {roomTypeOrder.map((type) => {
                  const Icon = roomIcons[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={config.type === type}
                      onClick={() => setConfig({ ...presetConfig(type), light: config.light })}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 border px-3 py-2.5 text-start text-sm transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        config.type === type ? "border-foreground bg-card" : "hover:bg-card/60",
                      )}
                    >
                      <Icon className="size-4 text-gold-text" aria-hidden />
                      {roomTypes[type].label}
                    </button>
                  );
                })}
              </div>
            </Fieldset>

            <Fieldset legend="ابعاد اتاق">
              <div className="flex flex-col gap-5">
                {(Object.keys(dimensionLabels) as (keyof RoomDimensions)[]).map((key) => (
                  <DimensionSlider
                    key={key}
                    label={dimensionLabels[key]}
                    value={config[key]}
                    min={limits[key].min}
                    max={limits[key].max}
                    onChange={(value) => update({ [key]: clampDimension(config.type, key, value) })}
                  />
                ))}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    مساحت {formatNumber(Math.round(config.width * config.length * 10) / 10)} متر
                    مربع
                  </span>
                  <button
                    type="button"
                    className="cursor-pointer underline-offset-4 hover:text-foreground hover:underline"
                    onClick={() => update(roomTypes[config.type].dimensions)}
                  >
                    اندازه‌ی پیش‌فرض
                  </button>
                </div>
              </div>
            </Fieldset>

            <Fieldset legend="رنگ دیوار">
              <div className="flex flex-wrap gap-2.5">
                {wallPaints.map((paint) => (
                  <button
                    key={paint.value}
                    type="button"
                    aria-label={paint.label}
                    title={paint.label}
                    aria-pressed={config.wall === paint.value}
                    onClick={() => update({ wall: paint.value })}
                    // Paint swatches show the paint itself, which is data rather than a theme colour.
                    style={{ backgroundColor: paint.value }}
                    className={cn(
                      "size-8 cursor-pointer rounded-full border shadow-sm transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      config.wall === paint.value
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-alabaster"
                        : "hover:scale-105",
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {wallPaints.find((p) => p.value === config.wall)?.label ?? "رنگ دلخواه"}
              </p>
            </Fieldset>

            <Fieldset legend="کف">
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(floorKinds) as FloorKind[]).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={config.floor === kind}
                    onClick={() => update({ floor: kind })}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 border px-3 py-2 text-start text-sm transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      config.floor === kind ? "border-foreground bg-card" : "hover:bg-card/60",
                    )}
                  >
                    <span
                      aria-hidden
                      style={{ backgroundColor: floorKinds[kind].swatch }}
                      className="size-4 shrink-0 rounded-sm border"
                    />
                    {floorKinds[kind].label}
                  </button>
                ))}
              </div>
            </Fieldset>

            <Fieldset legend="نور">
              <ToggleGroup.Root
                type="single"
                value={config.light}
                onValueChange={(next) => next && update({ light: next as LightMode })}
                aria-label="نور اتاق"
                className="grid grid-cols-3 gap-2"
              >
                {(Object.keys(lightModes) as LightMode[]).map((mode) => {
                  const Icon = lightIcons[mode];
                  return (
                    <ToggleGroup.Item
                      key={mode}
                      value={mode}
                      className="flex cursor-pointer items-center justify-center gap-1.5 border px-3 py-2 text-sm transition hover:bg-card/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=on]:border-foreground data-[state=on]:bg-card"
                    >
                      <Icon className="size-4 text-gold-text" aria-hidden />
                      {lightModes[mode].label}
                    </ToggleGroup.Item>
                  );
                })}
              </ToggleGroup.Root>
            </Fieldset>
          </div>
        </div>
      </div>
    </section>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 eyebrow text-muted-foreground">{legend}</legend>
      {children}
    </fieldset>
  );
}

function StageButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Icon className="size-3.5" aria-hidden />
      <span className="max-sm:sr-only">{label}</span>
    </button>
  );
}

function DimensionSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">{formatMetres(value)}</span>
      </div>
      {/* Native range: it follows the page direction, so the smallest size sits on the right. */}
      <input
        type="range"
        aria-label={label}
        aria-valuetext={formatMetres(value)}
        value={value}
        min={min}
        max={max}
        step={0.1}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-5 w-full cursor-pointer accent-foreground"
      />
    </div>
  );
}

function FitReadout({
  status,
  coverage,
  minGap,
  room,
  carpetSize,
  onAsk,
}: {
  status: FitStatus;
  coverage: number;
  minGap: number;
  room: RoomDimensions;
  carpetSize: string;
  onAsk: () => void;
}) {
  const copy = fitCopy[status];
  const good = status === "balanced";
  return (
    <div
      className="flex flex-col gap-4 border bg-card p-5 sm:flex-row sm:items-center"
      aria-live="polite"
      data-testid="fit-readout"
    >
      <div className="flex-1">
        <p className="flex items-center gap-2 font-display text-xl">
          <span aria-hidden className={cn("size-2 rounded-full", good ? "bg-gold" : "bg-madder")} />
          {copy.title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.advice}</p>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <dt>فرش:</dt>
            <dd>{carpetSize}</dd>
          </div>
          <div className="flex gap-1">
            <dt>اتاق:</dt>
            <dd>
              {formatNumber(room.width)} × {formatNumber(room.length)} متر
            </dd>
          </div>
          <div className="flex gap-1">
            <dt>پوشش کف:</dt>
            <dd>{formatNumber(Math.round(coverage * 100))}٪</dd>
          </div>
          {status !== "too-big" ? (
            <div className="flex gap-1">
              <dt>نزدیک‌ترین فاصله تا دیوار:</dt>
              <dd>{formatNumber(Math.round(minGap * 100))} سانتی‌متر</dd>
            </div>
          ) : null}
        </dl>
      </div>
      <Button onClick={onAsk} className="shrink-0">
        استعلام همین فرش
      </Button>
    </div>
  );
}
