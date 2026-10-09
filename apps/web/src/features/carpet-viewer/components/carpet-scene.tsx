"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { AdaptiveDpr, Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ACESFilmicToneMapping, PCFShadowMap } from "three";

import { CarpetCloth } from "./carpet-cloth";

interface CarpetSceneProps {
  carpet: Carpet;
  material: PileMaterial;
  reducedMotion: boolean;
  onGrab?: () => void;
}

export function CarpetScene({ carpet, material, reducedMotion, onGrab }: CarpetSceneProps) {
  return (
    <Canvas
      shadows={{ type: PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6.2], fov: 32 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      style={{ touchAction: "none" }}
    >
      <AdaptiveDpr pixelated={false} />
      {/* Local light rig instead of an HDR preset: presets download from a third-party CDN at runtime. */}
      <Environment resolution={256} environmentIntensity={0.6}>
        <Lightformer
          form="rect"
          intensity={2}
          color="#fff4e2"
          position={[0, 4, 4]}
          scale={[8, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#f3d27a"
          position={[5, 1, -2]}
          scale={[3, 6, 1]}
        />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[-5, 0, 3]} scale={3} />
      </Environment>
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
      <group rotation={[-0.32, 0.26, 0.08]}>
        <Suspense fallback={null}>
          <CarpetCloth
            carpet={carpet}
            material={material}
            reducedMotion={reducedMotion}
            onGrab={onGrab}
          />
        </Suspense>
      </group>
    </Canvas>
  );
}
