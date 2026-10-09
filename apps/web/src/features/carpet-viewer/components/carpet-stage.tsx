"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSyncExternalStore } from "react";

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

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

interface CarpetStageProps {
  carpet: Carpet;
  material: PileMaterial;
  className?: string;
  onGrab?: () => void;
}

/** The 3D carpet, or its photo when WebGL is missing (and during server render). */
export function CarpetStage({ carpet, material, className, onGrab }: CarpetStageProps) {
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
