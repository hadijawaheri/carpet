"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import dynamic from "next/dynamic";
import Image from "next/image";

import { SceneBoundary } from "./scene-boundary";
import { useStageSupport } from "./use-stage-support";

const CarpetRackScene = dynamic(
  () => import("./carpet-rack-scene").then((m) => m.CarpetRackScene),
  { ssr: false, loading: () => null },
);

interface CarpetRackStageProps {
  carpets: Carpet[];
  current: number;
  frontMaterial: PileMaterial;
  className?: string;
  imageSizes?: string;
  onSelect: (index: number) => void;
  onGrab?: () => void;
}

/** The swing rack in 3D, or the front carpet's photo when WebGL is missing. */
export function CarpetRackStage({
  carpets,
  current,
  frontMaterial,
  className,
  imageSizes = "(min-width: 768px) 40vw, 80vw",
  onSelect,
  onGrab,
}: CarpetRackStageProps) {
  const { reducedMotion, webgl, software, box, onScreen } = useStageSupport();
  const front = carpets[current];
  if (!front) return null;

  const photo = (
    <Image
      key={front.slug}
      src={front.image}
      alt=""
      width={Math.round(1200 * front.imageAspect)}
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
      // The turned pile runs past the pole off the frame; fade it out instead of cutting it.
      // Physical "right" on purpose: the 3D scene is not mirrored for RTL.
      style={{ maskImage: "linear-gradient(to right, black 78%, transparent)" }}
      role="img"
      aria-label={`فرش ${front.name} روی رگال؛ با موس یا انگشت گوشه‌ی پایین فرش را بگیرید و تکان دهید`}
    >
      {webgl ? (
        <SceneBoundary fallback={photo}>
          <CarpetRackScene
            carpets={carpets}
            current={current}
            frontMaterial={frontMaterial}
            reducedMotion={reducedMotion}
            active={onScreen}
            software={software}
            onSelect={onSelect}
            onGrab={onGrab}
          />
        </SceneBoundary>
      ) : (
        photo
      )}
    </div>
  );
}
