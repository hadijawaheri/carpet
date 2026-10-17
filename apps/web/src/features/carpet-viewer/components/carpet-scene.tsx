"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { AdaptiveDpr, Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { type PropsWithChildren, Suspense, useRef } from "react";
import { type Group, NeutralToneMapping, PCFShadowMap } from "three";

import type { PointerTilt } from "../pointer-tilt";
import { CarpetCloth } from "./carpet-cloth";

export type CarpetSceneVariant = "studio" | "gallery";

interface CarpetSceneProps {
  carpet: Carpet;
  material: PileMaterial;
  reducedMotion: boolean;
  variant?: CarpetSceneVariant;
  /** Pointer position over the hero, read every frame; the carpet leans towards it. */
  tilt?: PointerTilt;
  /** False while scrolled out of view: the simulation and rendering pause. */
  active?: boolean;
  onGrab?: () => void;
}

export function CarpetScene({
  carpet,
  material,
  reducedMotion,
  variant = "studio",
  tilt,
  active = true,
  onGrab,
}: CarpetSceneProps) {
  const gallery = variant === "gallery";
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      shadows={{ type: PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, gallery ? 6 : 5.4], fov: gallery ? 30 : 32 }}
      gl={{
        antialias: true,
        alpha: true,
        // Neutral keeps the photo's madder true on both the cream page and the red hall; ACES browned it.
        toneMapping: NeutralToneMapping,
        toneMappingExposure: gallery ? 1.35 : 1.2,
      }}
      style={{ touchAction: "none" }}
    >
      <AdaptiveDpr pixelated={false} />
      {/* Local light rig instead of an HDR preset: presets download from a third-party CDN at runtime. */}
      <Environment resolution={256} environmentIntensity={gallery ? 0.45 : 0.6}>
        <Lightformer
          form="rect"
          intensity={2}
          color="#fff4e2"
          position={[0, 4, 4]}
          scale={[8, 3, 1]}
        />
        {gallery ? null : (
          <Lightformer
            form="rect"
            intensity={1.2}
            color="#f3d27a"
            position={[5, 1, -2]}
            scale={[3, 6, 1]}
          />
        )}
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[-5, 0, 3]} scale={3} />
      </Environment>
      {gallery ? <GalleryLights /> : <StudioLights />}
      <TiltRig tilt={reducedMotion ? undefined : tilt}>
        <group rotation={gallery ? [0, -0.16, 0] : [-0.32, 0.26, 0.08]}>
          {gallery ? (
            // The wall sits just behind the hanging carpet so a lifted corner throws a sharp shadow.
            <mesh position={[0, 0, -0.08]} receiveShadow>
              <planeGeometry args={[30, 30]} />
              <shadowMaterial color="#160204" opacity={0.5} />
            </mesh>
          ) : null}
          <Suspense fallback={null}>
            <CarpetCloth
              carpet={carpet}
              material={material}
              reducedMotion={reducedMotion}
              hanging={gallery}
              // A carpet that follows the pointer is the page centrepiece; strong wind would fight the tilt.
              calm={tilt !== undefined}
              onGrab={onGrab}
            />
          </Suspense>
        </group>
      </TiltRig>
    </Canvas>
  );
}

function StudioLights() {
  return (
    <>
      <directionalLight
        position={[-3, 4, 6]}
        intensity={2.4}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-radius={6}
      >
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.1, 20]} />
      </directionalLight>
      <directionalLight position={[4, 2, -3]} intensity={1.4} color="#f3d27a" />
      <mesh position={[0, 0, -1.4]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial color="#4a1410" opacity={0.09} />
      </mesh>
    </>
  );
}

/** A museum spot raking down from above, so pile and knots catch the light. */
function GalleryLights() {
  return (
    <>
      <spotLight
        position={[1.6, 5.5, 4.2]}
        angle={0.42}
        penumbra={0.75}
        intensity={70}
        decay={1.6}
        color="#fff4e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={5}
      />
      <directionalLight position={[-3, 1.5, 6]} intensity={1.1} color="#fbf1e6" />
      <ambientLight intensity={0.12} color="#fff4ec" />
    </>
  );
}

const TILT_X = 0.28;
const TILT_Y = 0.38;

/** Eases the whole carpet towards the pointer, the 3D version of the design's mouse tilt. */
function TiltRig({ tilt, children }: PropsWithChildren<{ tilt?: PointerTilt }>) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    const group = ref.current;
    if (!group || !tilt) return;
    const ease = 1 - Math.exp(-delta * 4);
    group.rotation.x += (tilt.y * TILT_X - group.rotation.x) * ease;
    group.rotation.y += (tilt.x * TILT_Y - group.rotation.y) * ease;
  });
  return <group ref={ref}>{children}</group>;
}
