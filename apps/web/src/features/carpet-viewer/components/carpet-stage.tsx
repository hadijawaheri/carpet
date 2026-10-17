"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSyncExternalStore } from "react";

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
}

/** The 3D carpet, or its photo when WebGL is missing (and during server render). */
export function CarpetStage({ carpet, material, className, variant, onGrab }: CarpetStageProps) {
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

  return (
    <div
      className={className}
      role="img"
      aria-label={`فرش ${carpet.name}؛ با موس یا انگشت گوشه‌ی فرش را بگیرید و تکان دهید`}
    >
      {webgl ? (
        <CarpetScene
          carpet={carpet}
          material={material}
          reducedMotion={reducedMotion}
          variant={variant}
          onGrab={onGrab}
        />
      ) : (
        <Image
          src={carpet.image}
          alt=""
          width={Math.round(1200 * carpet.imageAspect)}
          height={1200}
          priority
          sizes="(min-width: 768px) 40vw, 80vw"
          className="mx-auto h-full w-auto object-contain"
        />
      )}
    </div>
  );
}
