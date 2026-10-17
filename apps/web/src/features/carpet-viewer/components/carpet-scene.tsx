"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { AdaptiveDpr, Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ACESFilmicToneMapping, NeutralToneMapping, PCFShadowMap } from "three";

import { CarpetCloth } from "./carpet-cloth";

export type CarpetSceneVariant = "studio" | "gallery";

interface CarpetSceneProps {
  carpet: Carpet;
  material: PileMaterial;
  reducedMotion: boolean;
  variant?: CarpetSceneVariant;
  onGrab?: () => void;
}

export function CarpetScene({
  carpet,
  material,
  reducedMotion,
  variant = "studio",
  onGrab,
}: CarpetSceneProps) {
  const gallery = variant === "gallery";
  return (
    <Canvas
      shadows={{ type: PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, gallery ? 6 : 6.2], fov: gallery ? 30 : 32 }}
      gl={{
        antialias: true,
        alpha: true,
        // Neutral keeps the madder of the photo; ACES pushed the red-on-red hall towards brown.
        toneMapping: gallery ? NeutralToneMapping : ACESFilmicToneMapping,
        toneMappingExposure: gallery ? 1.35 : 1.05,
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
            onGrab={onGrab}
          />
        </Suspense>
      </group>
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
        <shadowMaterial color="#4a1410" opacity={0.14} />
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
