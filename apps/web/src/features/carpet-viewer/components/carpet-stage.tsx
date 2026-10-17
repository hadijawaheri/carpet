"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { PointerTilt } from "../pointer-tilt";
import { webglSupport } from "../webgl-support";
import type { CarpetSceneVariant } from "./carpet-scene";
import { SceneBoundary } from "./scene-boundary";

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

interface CarpetStageProps {
  carpet: Carpet;
  material: PileMaterial;
  className?: string;
  variant?: CarpetSceneVariant;
  tilt?: PointerTilt;
  /** Shown while the 3D scene loads and when WebGL is missing. */
  imageSizes?: string;
  onGrab?: () => void;
}

/** The 3D carpet, or its photo when WebGL is missing (and during server render). */
export function CarpetStage({
  carpet,
  material,
  className,
  variant,
  tilt,
  imageSizes = "(min-width: 768px) 40vw, 80vw",
  onGrab,
}: CarpetStageProps) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  const webgl = useSyncExternalStore(
    () => () => {},
    () => webglSupport().version > 0,
    () => false,
  );
  const software = useSyncExternalStore(
    () => () => {},
    () => webglSupport().software,
    () => false,
  );
  // An off-screen carpet stops simulating, so the room preview below gets the whole GPU.
  const box = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry?.isIntersecting ?? true),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const photo = (
    <Image
      src={carpet.image}
      alt=""
      width={Math.round(1200 * carpet.imageAspect)}
      height={1200}
      priority
      sizes={imageSizes}
      className="mx-auto h-full w-auto object-contain"
    />
  );

  return (
    <div
      ref={box}
      className={className}
      role="img"
      aria-label={`فرش ${carpet.name}؛ با موس یا انگشت گوشه‌ی فرش را بگیرید و تکان دهید`}
    >
      {webgl ? (
        <SceneBoundary fallback={photo}>
          <CarpetScene
            carpet={carpet}
            material={material}
            reducedMotion={reducedMotion}
            variant={variant}
            tilt={tilt}
            active={onScreen}
            software={software}
            onGrab={onGrab}
          />
        </SceneBoundary>
      ) : (
        photo
      )}
    </div>
  );
}
