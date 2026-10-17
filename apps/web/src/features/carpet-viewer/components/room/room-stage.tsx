"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

import { RoomPlan } from "./room-plan";
import type { RoomSceneProps } from "./room-scene";

const RoomScene = dynamic(() => import("./room-scene").then((m) => m.RoomScene), {
  ssr: false,
  loading: () => <StageLoading />,
});

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

function StageLoading() {
  return (
    <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
      در حال چیدن اتاق…
    </div>
  );
}

type RoomStageProps = Omit<RoomSceneProps, "reducedMotion">;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const mql = window.matchMedia(reducedMotionQuery);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

/** The 3D room, or a to-scale floor plan where WebGL 2 is missing. */
export function RoomStage(props: RoomStageProps) {
  const webgl = useSyncExternalStore(
    () => () => {},
    canUseWebGL,
    () => null,
  );
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  if (webgl === null) return <StageLoading />;
  if (!webgl) {
    return (
      <RoomPlan
        config={props.config}
        layout={props.layout}
        carpet={props.carpet}
        placement={props.placement}
      />
    );
  }
  return <RoomScene {...props} reducedMotion={reducedMotion} />;
}
