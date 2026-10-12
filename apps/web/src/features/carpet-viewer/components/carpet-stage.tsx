"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import type { CarpetSceneVariant } from "./carpet-scene";

const CarpetScene = dynamic(() => import("./carpet-scene").then((m) => m.CarpetScene), {
  ssr: false,
  loading: () => null,
});

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const mql = window.matchMedia(reducedMotionQuery);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

// useSyncExternalStore reads the snapshot on every render; probing each time opened a new WebGL context per render.
let webglSupport: boolean | undefined;

function canUseWebGL() {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    webglSupport = Boolean(gl);
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

interface CarpetStageProps {
  carpet: Carpet;
  material: PileMaterial;
  className?: string;
  variant?: CarpetSceneVariant;
  onGrab?: () => void;
  /** The keyboard shake button above the carpet. On by default: every 3D control needs a keyboard route. */
  shakeControl?: boolean;
}

/** The 3D carpet, or its photo when WebGL is missing (and during server render). */
export function CarpetStage({
  carpet,
  material,
  className,
  variant,
  onGrab,
  shakeControl = true,
}: CarpetStageProps) {
  const shake = useRef<(() => void) | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  const webgl = useSyncExternalStore(
    () => () => {},
    canUseWebGL,
    () => false,
  );

  // The server and the first client render both say "no WebGL"; the caption waits for hydration so WebGL users never see it.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div
      className={cn("flex flex-col", className)}
      role="group"
      aria-label={`فرش ${carpet.name}؛ با موس یا انگشت گوشه‌ی فرش را بگیرید و تکان دهید`}
    >
      {webgl && shakeControl ? (
        <div className="flex shrink-0 justify-center py-2">
          {/* aria-disabled, not disabled: the button stays focusable so a keyboard user hears why nothing moves. */}
          <button
            type="button"
            aria-disabled={reducedMotion || undefined}
            onClick={() => {
              if (!reducedMotion) shake.current?.();
            }}
            className="cursor-pointer rounded-sm px-3 py-2 text-label font-semibold text-foreground underline decoration-saffron underline-offset-8 focus-visible:ring-2 focus-visible:ring-saffron focus-visible:outline-none aria-disabled:cursor-default aria-disabled:no-underline"
          >
            {reducedMotion ? "فرش به‌خواست شما ساکن است" : "فرش را تکان دهید"}
          </button>
        </div>
      ) : null}
      {hydrated && !webgl ? (
        <p className="shrink-0 px-3 py-3 text-center text-label text-on-wall-muted">
          این مرورگر نسخه‌ی سه‌بعدی ندارد؛ این عکس فرش است.
        </p>
      ) : null}
      <div className="relative min-h-0 flex-1">
        {webgl ? (
          <CarpetScene
            carpet={carpet}
            material={material}
            reducedMotion={reducedMotion}
            variant={variant}
            onGrab={onGrab}
            shakeRef={shake}
          />
        ) : (
          <Image
            src={carpet.image}
            alt=""
            width={Math.round(1200 * carpet.imageAspect)}
            height={1200}
            priority
            sizes="(min-width: 768px) 40vw, 80vw"
            className="absolute inset-0 size-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
