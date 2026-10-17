"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import {
  AdaptiveDpr,
  CameraControls,
  Environment,
  Lightformer,
  PerformanceMonitor,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { type ComponentRef, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Color, PCFShadowMap } from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

import { floorKinds, type LightMode, type RoomConfig } from "../../room/room-config";
import type { RoomLayout, WindowOpening } from "../../room/room-layout";
import type { RugPlacement } from "../../room/rug-placement";
import { FloorRug } from "./floor-rug";
import { FurnitureSet } from "./furniture";
import { RoomShell } from "./room-shell";

RectAreaLightUniformsLib.init();

export type RoomView = "overview" | "eye" | "top";

export interface RoomSceneProps {
  config: RoomConfig;
  layout: RoomLayout;
  carpet: Carpet;
  material: PileMaterial;
  placement: RugPlacement;
  view: RoomView;
  reducedMotion: boolean;
  /** Bumped to replay the camera move to the chosen view. */
  viewToken: number;
  onCaptureReady?: (capture: () => string) => void;
}

const BACKDROP = "#efe8df";

export function RoomScene(props: RoomSceneProps) {
  const [ambientOcclusion, setAmbientOcclusion] = useState(true);
  return (
    <Canvas
      // Renders only when something changes: an idle room costs no battery.
      frameloop="demand"
      shadows={{ type: PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [6, 6, 8], fov: 40, near: 0.05, far: 120 }}
      gl={{ antialias: false, preserveDrawingBuffer: true, toneMappingExposure: 1 }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={[BACKDROP]} />
      <AdaptiveDpr pixelated={false} />
      {/* Slow devices drop ambient occlusion before the frame rate drops. */}
      <PerformanceMonitor onDecline={() => setAmbientOcclusion(false)} />
      <SceneContent {...props} />
      <EffectComposer multisampling={4}>
        <N8AO
          enabled={ambientOcclusion}
          aoRadius={0.55}
          distanceFalloff={0.5}
          intensity={2.4}
          quality="medium"
          halfRes
          color="#1b120c"
        />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
    </Canvas>
  );
}

function SceneContent({
  config,
  layout,
  carpet,
  material,
  placement,
  view,
  viewToken,
  reducedMotion,
  onCaptureReady,
}: RoomSceneProps) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    onCaptureReady?.(() => gl.domElement.toDataURL("image/jpeg", 0.92));
  }, [gl, onCaptureReady]);

  const room = { width: config.width, length: config.length, height: config.height };
  const night = config.light === "night";
  return (
    <>
      <CameraRig
        config={config}
        placement={placement}
        view={view}
        token={viewToken}
        reducedMotion={reducedMotion}
      />
      <RoomLights config={config} windows={layout.windows} />
      <RoomShell
        room={room}
        wall={config.wall}
        floor={config.floor}
        light={config.light}
        windows={layout.windows}
        classic={layout.crownMoulding}
      />
      <FurnitureSet type={config.type} items={layout.furniture} night={night} room={room} />
      <Suspense fallback={null}>
        <FloorRug
          key={`${carpet.slug}-${config.type}`}
          carpet={carpet}
          material={material}
          placement={placement}
          reducedMotion={reducedMotion}
        />
      </Suspense>
      {/* Grounds the cut-away model: the room's own shadow on the backdrop. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial color="#3a2a1e" opacity={0.18} />
      </mesh>
    </>
  );
}

function CameraRig({
  config,
  placement,
  view,
  token,
  reducedMotion,
}: {
  config: RoomConfig;
  placement: RugPlacement;
  view: RoomView;
  token: number;
  reducedMotion: boolean;
}) {
  const controls = useRef<ComponentRef<typeof CameraControls>>(null);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const { width, length, height } = config;

  useEffect(() => {
    const rig = controls.current;
    if (!rig) return;
    const animate = !reducedMotion;
    if (view === "eye") {
      // Standing by the side wall at eye height, looking across the carpet rather than over chairs.
      const standZ = Math.min(length / 2 - 0.45, Math.max(-length / 2 + 0.45, placement.z + 1.3));
      void rig.setLookAt(width / 2 - 0.45, 1.62, standZ, placement.x, 0.2, placement.z, animate);
      return;
    }
    const fov = (40 * Math.PI) / 180;
    const fit = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect));
    if (view === "top") {
      const span = Math.max(width / Math.min(1, aspect), length) / 2 + 0.6;
      void rig.setLookAt(0, height + span / Math.tan(fit / 2), 0.001, 0, 0, 0, animate);
      return;
    }
    // Frames the floor rather than the whole box, so the carpet reads at a useful size.
    const radius = 0.5 * Math.hypot(width, length, height) * 0.74;
    const distance = radius / Math.sin(fit / 2);
    const direction = [0.62, 0.72, 1].map((v) => v / Math.hypot(0.62, 0.72, 1));
    void rig.setLookAt(
      direction[0]! * distance,
      direction[1]! * distance,
      direction[2]! * distance,
      placement.x * 0.7,
      0.3,
      placement.z * 0.7,
      animate,
    );
    // Placement is read when a view is chosen; the camera does not chase the carpet afterwards.
  }, [view, token, width, length, height, aspect, reducedMotion, placement]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={0.6}
      maxDistance={Math.max(width, length) * 4}
      maxPolarAngle={Math.PI / 2 - 0.04}
      smoothTime={0.35}
      dollyToCursor
    />
  );
}

interface LightRecipe {
  sun: { direction: [number, number, number]; color: string; intensity: number };
  sky: number;
  window: { color: string; intensity: number };
  environment: number;
}

const recipes: Record<LightMode, LightRecipe> = {
  day: {
    sun: { direction: [-1, 1.15, 0.42], color: "#fff2df", intensity: 3.4 },
    sky: 0.75,
    window: { color: "#e9f1f7", intensity: 4.5 },
    environment: 0.55,
  },
  golden: {
    sun: { direction: [-1, 0.4, -0.32], color: "#ffb36e", intensity: 3 },
    sky: 0.45,
    window: { color: "#ffd2a1", intensity: 2.6 },
    environment: 0.35,
  },
  night: {
    sun: { direction: [-1, 1.6, 0.2], color: "#9fb4d8", intensity: 0.12 },
    sky: 0.07,
    window: { color: "#5a6f96", intensity: 0.25 },
    environment: 0.12,
  },
};

/**
 * Daylight that enters the way it does in a real room: a sun through the window (walls block it
 * everywhere else), soft sky light from each opening, and bounce tinted by the walls and floor.
 */
function RoomLights({ config, windows }: { config: RoomConfig; windows: WindowOpening[] }) {
  const recipe = recipes[config.light];
  const { width, length, height } = config;
  const span = Math.max(width, length) * 0.75 + height;
  const bounce = useMemo(() => {
    const sky = new Color("#ffffff").lerp(new Color(config.wall), 0.45);
    const ground = new Color(floorKinds[config.floor].swatch).lerp(new Color("#ffffff"), 0.3);
    return { sky, ground };
  }, [config.wall, config.floor]);
  const [dx, dy, dz] = recipe.sun.direction;
  const norm = Math.hypot(dx, dy, dz);
  const sunDistance = span * 2;

  return (
    <>
      <directionalLight
        position={[(dx / norm) * sunDistance, (dy / norm) * sunDistance, (dz / norm) * sunDistance]}
        color={recipe.sun.color}
        intensity={recipe.sun.intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={4}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-span, span, span, -span, 0.5, sunDistance * 2]}
        />
      </directionalLight>
      <hemisphereLight args={[bounce.sky, bounce.ground, recipe.sky]} />
      <ambientLight intensity={config.light === "night" ? 0.05 : 0.12} color="#fff6ea" />
      {windows.map((w, i) => (
        <rectAreaLight
          key={i}
          position={[-width / 2 + 0.02, (w.sill + w.top) / 2, w.z]}
          rotation={[0, -Math.PI / 2, 0]}
          width={w.width}
          height={w.top - w.sill}
          color={recipe.window.color}
          intensity={recipe.window.intensity}
        />
      ))}
      {/* Reflections: the window as a bright panel, the ceiling as a soft one. Local, no downloads. */}
      <Environment
        key={`${config.light}-${config.wall}`}
        resolution={128}
        frames={1}
        environmentIntensity={recipe.environment}
      >
        <color attach="background" args={[config.wall]} />
        {windows.map((w, i) => (
          <Lightformer
            key={i}
            form="rect"
            intensity={recipe.window.intensity}
            color={recipe.window.color}
            position={[-width / 2, (w.sill + w.top) / 2, w.z]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[w.width, w.top - w.sill, 1]}
          />
        ))}
        <Lightformer
          form="rect"
          intensity={config.light === "night" ? 0.6 : 1.2}
          color="#fff4e6"
          position={[0, height, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[width, length, 1]}
        />
      </Environment>
    </>
  );
}
