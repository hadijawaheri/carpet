"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { AdaptiveDpr, Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { type PropsWithChildren, Suspense, useEffect, useMemo, useRef } from "react";
import { type Group, NeutralToneMapping, PCFShadowMap } from "three";

import { rackAngle, RackArm } from "../rack-arm";
import { CARPET_HEIGHT, CarpetCloth } from "./carpet-cloth";
import { SteadyFrames } from "./steady-frames";

/** Gap between the pole and each carpet's near edge. */
const POLE_GAP = 0.07;
/** Arms are stacked up the pole, as on a real rack, so they never pass through each other. */
const ARM_RISE = 0.028;
const ARM_RADIUS = 0.016;
const POLE_X = 0;
const TOP = CARPET_HEIGHT / 2;
/** Turns the rack so the front carpet's free edge comes forward and the turned pile recedes. */
const RACK_TURN = 0.2;

interface CarpetRackSceneProps {
  carpets: Carpet[];
  current: number;
  /** Overrides the front carpet's pile, so one carpet can be felt in each material. */
  frontMaterial: PileMaterial;
  reducedMotion: boolean;
  active?: boolean;
  software?: boolean;
  onSelect: (index: number) => void;
  onGrab?: () => void;
}

/**
 * A carpet seller's swing rack: each carpet hangs from an arm hinged on one pole, and the
 * carpets are turned over like the pages of a book. Only the front carpet can be grabbed.
 */
export function CarpetRackScene({
  carpets,
  current,
  frontMaterial,
  reducedMotion,
  active = true,
  software = false,
  onSelect,
  onGrab,
}: CarpetRackSceneProps) {
  const frameloop = !active ? "never" : software ? "demand" : "always";
  const arms = useMemo(() => {
    const list = carpets.map((_, i) => new RackArm(rackAngle(i, 0)));
    RackArm.chain(list);
    return list;
  }, [carpets]);
  const front = carpets[current];
  // The front carpet stands in the middle of the frame; the pole sits off to its right.
  const frontCentre = front ? CARPET_HEIGHT * front.imageAspect * 0.5 + POLE_GAP : 0;

  useEffect(() => {
    const previous = arms.findIndex((arm) => arm.front);
    arms.forEach((arm, i) => {
      // Turning back to the first carpet flips the whole pile over, one page after another.
      const order = current < previous ? previous - 1 - i : i - previous;
      arm.turnTo(rackAngle(i, current), previous < 0 ? 0 : Math.max(0, order) * 0.09);
      arm.front = i === current;
    });
  }, [arms, current]);

  return (
    <Canvas
      frameloop={frameloop}
      shadows={{ type: PCFShadowMap }}
      dpr={software ? 1 : [1, 2]}
      camera={{ position: [0, 0.1, 5.5], fov: 33 }}
      gl={{
        antialias: !software,
        alpha: true,
        toneMapping: NeutralToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{ touchAction: "none" }}
    >
      <AdaptiveDpr pixelated={false} />
      {software && active ? <SteadyFrames fps={24} /> : null}
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
          intensity={1.4}
          color="#f3d27a"
          position={[-5, 1, 2]}
          scale={[3, 6, 1]}
        />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[5, 0, 3]} scale={3} />
      </Environment>
      <RackLights />
      <CentreOn offset={POLE_X - frontCentre} instant={reducedMotion}>
        <Pole />
        {carpets.map((carpet, i) => {
          const arm = arms[i]!;
          const width = CARPET_HEIGHT * carpet.imageAspect;
          const pivotX = width / 2 + POLE_GAP;
          const lift = (carpets.length - 1 - i) * ARM_RISE;
          return (
            <group key={carpet.slug} position={[POLE_X - pivotX, lift, 0]}>
              <Arm arm={arm} pivotX={pivotX} length={width + POLE_GAP + 0.06} />
              <Suspense fallback={null}>
                <CarpetCloth
                  carpet={carpet}
                  material={i === current ? frontMaterial : carpet.material}
                  reducedMotion={reducedMotion}
                  arm={arm}
                  pivotX={pivotX}
                  grabbable={i === current}
                  onSelect={() => onSelect(i)}
                  onGrab={onGrab}
                />
              </Suspense>
            </group>
          );
        })}
      </CentreOn>
    </Canvas>
  );
}

/** Slides the turned rack sideways so the point at local x = `offset` sits in the middle. */
function CentreOn({
  offset,
  instant,
  children,
}: PropsWithChildren<{ offset: number; instant: boolean }>) {
  const ref = useRef<Group>(null);
  const target = -offset * Math.cos(RACK_TURN);
  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    const ease = instant ? 1 : 1 - Math.exp(-delta * 3);
    group.position.x += (target - group.position.x) * ease;
  });
  return (
    <group ref={ref} rotation={[0, RACK_TURN, 0]} position={[target, 0.05, 0]}>
      {children}
    </group>
  );
}

const BRASS = { color: "#c99a45", metalness: 0.85, roughness: 0.32 } as const;

function Pole() {
  const height = CARPET_HEIGHT + 0.75;
  return (
    <group position={[POLE_X, 0, 0]}>
      <mesh position={[0, TOP + 0.35 - height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.032, height, 24]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, TOP + 0.36, 0]}>
        <sphereGeometry args={[0.055, 24, 16]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
    </group>
  );
}

/** The arm turns with its carpet; it is drawn here because the cloth only knows its own rod line. */
function Arm({ arm, pivotX, length }: { arm: RackArm; pivotX: number; length: number }) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = -arm.angle;
  });
  return (
    <group ref={ref} position={[pivotX, TOP + 0.03, 0]}>
      <mesh position={[-length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[ARM_RADIUS, ARM_RADIUS, length, 16]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      {/* Hinge collar on the pole */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.05, 20]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
    </group>
  );
}

/** A raking key from the side, so pile and silk sheen catch the light as a carpet swings. */
function RackLights() {
  return (
    <>
      <directionalLight
        position={[-3.5, 4, 5]}
        intensity={2.3}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-radius={6}
      >
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.1, 20]} />
      </directionalLight>
      <directionalLight position={[4, 2, 3]} intensity={0.9} color="#f3d27a" />
      <ambientLight intensity={0.15} color="#fff4ec" />
      <mesh position={[0, 0, -1.6]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial color="#4a1410" opacity={0.08} />
      </mesh>
    </>
  );
}
