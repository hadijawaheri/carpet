"use client";

import type { Carpet, RoomLayout } from "@farsh/contracts";
import {
  Box,
  Download,
  Hand,
  Link2,
  Move,
  Proportions,
  RotateCcw,
  ScanEye,
  Waves,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useReducer, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useReducedMotion, useWebglSupport } from "@/lib/browser-support";
import { paths } from "@/lib/paths";
import { encodeLayout } from "@/lib/room-codec";

import { NUDGE, nudgeItem, roomReducer } from "../state/room-reducer";
import { type PanelTab, RoomPanel } from "./room-panel";
import { type RoomTool, RUG_ID } from "./room-scene";
import type { RoomView } from "./room-shell";

const RoomCanvas = dynamic(() => import("./room-canvas").then((m) => m.RoomCanvas), {
  ssr: false,
  loading: () => (
    <p role="status" className="grid h-full place-items-center text-label text-on-wall-muted">
      در حال ساختن اتاق…
    </p>
  ),
});

export const HASH_PREFIX = "#r=";

const views: { value: RoomView; label: string; icon: typeof Box }[] = [
  { value: "orbit", label: "نمای کلی", icon: Box },
  { value: "inside", label: "از داخل اتاق", icon: ScanEye },
  { value: "top", label: "از بالا", icon: Proportions },
];

const tools: { value: RoomTool; label: string; icon: typeof Box }[] = [
  { value: "arrange", label: "چیدمان", icon: Move },
  { value: "touch", label: "لمس فرش", icon: Hand },
];

interface RoomStudioProps {
  carpets: Carpet[];
  initial: RoomLayout;
  /** Said once on first render, e.g. that a pasted link could not be read. */
  notice?: string;
}

export function RoomStudio({ carpets, initial, notice }: RoomStudioProps) {
  const [{ layout }, dispatch] = useReducer(roomReducer, { layout: initial, carpets }, (start) =>
    roomReducer(start, { type: "load", layout: start.layout }),
  );
  const [selectedId, setSelectedId] = useState<string | null>(RUG_ID);
  const [tab, setTab] = useState<PanelTab>("rug");
  const [view, setView] = useState<RoomView>("orbit");
  const [tool, setTool] = useState<RoomTool>("arrange");
  const [status, setStatus] = useState(notice ?? "");
  const [confirmReset, setConfirmReset] = useState(false);
  const [paintingImages, setPaintingImages] = useState<Record<string, string>>({});

  const shakeRef = useRef<(() => void) | null>(null);
  const captureRef = useRef<(() => Promise<Blob | null>) | null>(null);
  const initialEncoded = useRef(encodeLayout(initial));
  const imagesRef = useRef(paintingImages);

  const reducedMotion = useReducedMotion();
  const webgl = useWebglSupport();
  const carpet = carpets.find((c) => c.slug === layout.rug.carpet) ?? carpets[0];

  // The room lives in the address, so a refresh or a pasted link brings it back; written after a pause, not on every drag frame.
  useEffect(() => {
    const encoded = encodeLayout(layout);
    if (encoded === initialEncoded.current && !window.location.hash) return;
    const timer = window.setTimeout(() => {
      window.history.replaceState(null, "", `${window.location.pathname}${HASH_PREFIX}${encoded}`);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [layout]);

  useEffect(() => {
    if (!confirmReset) return;
    const timer = window.setTimeout(() => setConfirmReset(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmReset]);

  useEffect(() => {
    imagesRef.current = paintingImages;
  }, [paintingImages]);
  useEffect(() => {
    return () => {
      for (const url of Object.values(imagesRef.current)) URL.revokeObjectURL(url);
    };
  }, []);

  if (!carpet) return null;

  // Without WebGL the controls would change a room nobody can see, so only the carpet's photo is offered.
  if (!webgl) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
        <Image
          src={carpet.image}
          alt={`فرش ${carpet.name}`}
          width={Math.round(360 * carpet.imageAspect)}
          height={360}
          className="h-72 w-auto object-contain"
        />
        <p className="text-on-wall-muted">
          این مرورگر نسخه‌ی سه‌بعدی ندارد؛ برای چیدن اتاق به مرورگری با WebGL نیاز است.
        </p>
        <Link
          href={paths.collection}
          className="text-sm font-semibold underline decoration-saffron underline-offset-8 focus-visible:ring-2 focus-visible:ring-saffron focus-visible:outline-none"
        >
          بازگشت به مجموعه
        </Link>
      </div>
    );
  }

  const select = (id: string | null) => {
    setSelectedId(id);
    if (id === RUG_ID) setTab("rug");
    else if (id) setTab("items");
  };

  const chooseView = (next: RoomView) => {
    setView(next);
    // From above the rug is what you came to touch; from the floor plan view furniture is what you rearrange.
    setTool(next === "top" ? "touch" : "arrange");
  };

  const setPaintingImage = (id: string, file: File | null) => {
    setPaintingImages((current) => {
      const { [id]: previous, ...rest } = current;
      if (previous) URL.revokeObjectURL(previous);
      return file ? { ...rest, [id]: URL.createObjectURL(file) } : rest;
    });
  };

  const shareUrl = () =>
    `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${encodeLayout(layout)}`;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setStatus("پیوند این اتاق کپی شد. هر که بازش کند، همین اتاق را با همین رنگ‌ها می‌بیند.");
    } catch (error: unknown) {
      void error;
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${HASH_PREFIX}${encodeLayout(layout)}`,
      );
      setStatus("کپی نشد؛ پیوند اتاق در نوار آدرس مرورگر است.");
    }
  };

  const saveImage = async () => {
    const blob = await captureRef.current?.();
    if (!blob) {
      setStatus("تصویر ساخته نشد؛ دوباره امتحان کنید.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `farsh-${carpet.slug}.png`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("تصویر اتاق ذخیره شد.");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Escape") {
      select(null);
      return;
    }
    const step = {
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
    }[event.key];
    if (!step || !selectedId) return;
    event.preventDefault();
    const [dx, dz] = step as [number, number];
    if (selectedId === RUG_ID) {
      dispatch({ type: "rug", patch: { x: layout.rug.x + dx, z: layout.rug.z + dz } });
      return;
    }
    const item = layout.items.find((i) => i.id === selectedId);
    if (item) dispatch({ type: "replace", item: nudgeItem(item, dx, dz) });
  };

  return (
    <div className="mx-auto grid w-full max-w-[110rem] gap-4 px-4 pt-4 pb-8 sm:px-10 lg:h-[calc(100dvh-6.5rem)] lg:min-h-[38rem] lg:grid-cols-[minmax(0,1fr)_24rem] [&>*]:min-w-0">
      <div className="flex min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-card px-3 py-2 text-card-foreground shadow-mount">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ToggleGroup
              type="single"
              value={view}
              aria-label="زاویه‌ی دید"
              onValueChange={(next) => {
                const picked = views.find((v) => v.value === next);
                if (picked) chooseView(picked.value);
              }}
            >
              {views.map(({ value, label, icon: Icon }) => (
                <ToggleGroupItem key={value} value={value} size="sm">
                  <Icon aria-hidden className="size-4" />
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <ToggleGroup
              type="single"
              value={tool}
              aria-label="کار با موس"
              onValueChange={(next) => {
                const picked = tools.find((t) => t.value === next);
                if (picked) setTool(picked.value);
              }}
            >
              {tools.map(({ value, label, icon: Icon }) => (
                <ToggleGroupItem key={value} value={value} size="sm">
                  <Icon aria-hidden className="size-4" />
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              // aria-disabled, not disabled: the button stays focusable so a keyboard user hears why nothing moves.
              aria-disabled={reducedMotion || undefined}
              onClick={() => {
                if (!reducedMotion) shakeRef.current?.();
              }}
              className="aria-disabled:cursor-default aria-disabled:no-underline"
            >
              <Waves aria-hidden />
              {reducedMotion ? "فرش ساکن است" : "فرش را تکان دهید"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={saveImage}>
              <Download aria-hidden />
              <span className="sr-only sm:not-sr-only">ذخیره‌ی تصویر</span>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={share}>
              <Link2 aria-hidden />
              <span className="sr-only sm:not-sr-only">پیوند اتاق</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  return;
                }
                setConfirmReset(false);
                dispatch({ type: "reset", carpetSlug: carpet.slug });
                setSelectedId(RUG_ID);
                setStatus("اتاق به حالت اول برگشت.");
              }}
            >
              <RotateCcw aria-hidden />
              <span className={confirmReset ? undefined : "sr-only sm:not-sr-only"}>
                {confirmReset ? "مطمئنید؟ دوباره بزنید" : "از اول"}
              </span>
            </Button>
          </div>
        </div>

        <div
          role="group"
          tabIndex={0}
          aria-label="اتاق سه‌بعدی؛ با کلیدهای جهت‌دار، چیز انتخاب‌شده را جابه‌جا کنید"
          onKeyDown={onKeyDown}
          className="relative h-[60dvh] min-h-[24rem] overflow-hidden bg-wall-deep outline-none focus-visible:ring-2 focus-visible:ring-saffron lg:h-auto lg:min-h-0 lg:flex-1"
        >
          <RoomCanvas
            layout={layout}
            carpet={carpet}
            selectedId={selectedId}
            tool={tool}
            view={view}
            reducedMotion={reducedMotion}
            paintingImages={paintingImages}
            shakeRef={shakeRef}
            captureRef={captureRef}
            dispatch={dispatch}
            onSelect={select}
          />
          <p className="pointer-events-none absolute start-3 bottom-3 max-w-[calc(100%-1.5rem)] bg-wall-deep/80 px-3 py-1 text-accession text-on-wall-muted">
            {tool === "touch"
              ? "گوشه‌ی فرش را بگیرید و بالا بکشید؛ رها کنید تا روی زمین بنشیند."
              : view === "inside"
                ? "بکشید تا اطراف را ببینید."
                : "اثاث را بکشید تا جابه‌جا شود؛ فضای خالی را بکشید تا بچرخید."}
          </p>
        </div>
        <p role="status" aria-live="polite" className="min-h-6 text-label text-on-wall-muted">
          {status}
        </p>
      </div>

      <aside
        aria-label="ساختن اتاق"
        className="flex min-h-0 flex-col bg-card p-4 text-card-foreground shadow-mount lg:h-full"
      >
        <RoomPanel
          layout={layout}
          carpets={carpets}
          carpet={carpet}
          selectedId={selectedId}
          tab={tab}
          paintingImages={paintingImages}
          onTab={(next) => {
            setTab(next);
            // The rug tab is about the rug, so arrow keys and the outline follow it there.
            if (next === "rug") setSelectedId(RUG_ID);
          }}
          dispatch={dispatch}
          onSelect={select}
          onPaintingImage={setPaintingImage}
        />
      </aside>
    </div>
  );
}
