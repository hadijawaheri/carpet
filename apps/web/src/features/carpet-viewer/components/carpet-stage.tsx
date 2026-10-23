"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import dynamic from "next/dynamic";
import Image from "next/image";

import type { PointerTilt } from "../pointer-tilt";
import type { CarpetSceneVariant } from "./carpet-scene";
import { SceneBoundary } from "./scene-boundary";
import { useStageSupport } from "./use-stage-support";

const CarpetScene = dynamic(() => import("./carpet-scene").then((m) => m.CarpetScene), {
  ssr: false,
  loading: () => null,
});

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
  const { reducedMotion, webgl, software, box, onScreen } = useStageSupport();

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
