"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

import { webglSupport } from "../../webgl-support";
import { SceneBoundary } from "../scene-boundary";
import { RoomPlan } from "./room-plan";
import type { RoomSceneProps } from "./room-scene";

const RoomScene = dynamic(() => import("./room-scene").then((m) => m.RoomScene), {
  ssr: false,
  loading: () => <StageLoading />,
});

function StageLoading() {
  return (
    <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
      در حال چیدن اتاق…
    </div>
  );
}

type RoomStageProps = Omit<RoomSceneProps, "reducedMotion" | "software">;

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
    () => webglSupport().version === 2,
    () => null,
  );
  const software = useSyncExternalStore(
    () => () => {},
    () => webglSupport().software,
    () => false,
  );
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  if (webgl === null) return <StageLoading />;
  const plan = (
    <RoomPlan
      config={props.config}
      layout={props.layout}
      carpet={props.carpet}
      placement={props.placement}
    />
  );
  if (!webgl) return plan;
  return (
    <SceneBoundary fallback={plan}>
      <RoomScene {...props} reducedMotion={reducedMotion} software={software} />
    </SceneBoundary>
  );
}
