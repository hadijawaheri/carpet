"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { materialPresets } from "@farsh/contracts";
import { useTexture } from "@react-three/drei";
import { type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  FrontSide,
  type Group,
  Plane,
  SRGBColorSpace,
  Vector3,
} from "three";

import { ClothSolver } from "../cloth-solver";

const STEP = 1 / 60;
const CARPET_HEIGHT = 2.2;
const GRID_COLUMNS = 34;
/** Lifts the held point towards the viewer, so a grab reads as picking the carpet up. */
const GRAB_LIFT = 0.25;
/**
 * Velocity kick the keyboard shake gives every particle at once. The material-change kicks are 0.01
 * and 0.03; a shake must read as larger than those without throwing the sheet. A starting value,
 * not a measurement: tune it by eye.
 */
const SHAKE_STRENGTH = 0.08;

interface CarpetClothProps {
  carpet: Carpet;
  material: PileMaterial;
  reducedMotion: boolean;
  /** Pins the top edge, as on a gallery rod; lifting a lower corner shows the plain reverse. */
  hanging?: boolean;
  onGrab?: () => void;
  /** Filled with a function that kicks the cloth; the stage's button calls it. Null while motion is reduced. */
  shakeRef?: RefObject<(() => void) | null>;
}

export function CarpetCloth({
  carpet,
  material,
  reducedMotion,
  hanging = false,
  onGrab,
  shakeRef,
}: CarpetClothProps) {
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const texture = useTexture(carpet.image, (loaded) => {
    loaded.colorSpace = SRGBColorSpace;
    loaded.anisotropy = maxAnisotropy;
  });
  const camera = useThree((s) => s.camera);
  const meshRef = useRef<Group>(null);
  const width = CARPET_HEIGHT * carpet.imageAspect;

  const solver = useMemo(() => new ClothSolver(width, CARPET_HEIGHT, GRID_COLUMNS), [width]);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(solver.positions, 3).setUsage(DynamicDrawUsage));
    g.setAttribute("uv", new BufferAttribute(solver.uvs, 2));
    g.setIndex(new BufferAttribute(solver.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [solver]);
  const preset = materialPresets[material];
  const surface = preset.surface;

  useEffect(() => {
    solver.setHanging(hanging);
  }, [solver, hanging]);

  useEffect(() => {
    if (reducedMotion) return;
    solver.impulse(material === "machine" ? 0.01 : 0.03);
  }, [solver, material, reducedMotion]);

  // The ref is the only channel between the stage's button and the solver; it is emptied under reduced motion.
  useEffect(() => {
    if (!shakeRef) return;
    shakeRef.current = reducedMotion ? null : () => solver.impulse(SHAKE_STRENGTH);
    return () => {
      shakeRef.current = null;
    };
  }, [shakeRef, solver, reducedMotion]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const accumulated = useRef(0);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    accumulated.current += Math.min(delta, 0.05);
    while (accumulated.current >= STEP) {
      elapsed.current += STEP;
      solver.step(STEP, elapsed.current, preset.physics, !reducedMotion);
      accumulated.current -= STEP;
    }
    const position = geometry.getAttribute("position");
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  });

  const dragPlane = useMemo(() => new Plane(), []);
  const hit = useMemo(() => new Vector3(), []);

  const toLocal = (point: Vector3) => meshRef.current?.worldToLocal(point.clone());

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (reducedMotion) return;
    event.stopPropagation();
    const local = toLocal(event.point);
    if (!local) return;
    solver.grabNearest(local.x, local.y, local.z);
    dragPlane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new Vector3()).negate(),
      event.point,
    );
    (event.target as unknown as Element).setPointerCapture(event.pointerId);
    document.body.style.cursor = "grabbing";
    onGrab?.();
  };
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!solver.isGrabbing || !event.ray.intersectPlane(dragPlane, hit)) return;
    const local = toLocal(hit);
    if (local) solver.moveTarget(local.x, local.y, local.z + GRAB_LIFT);
  };
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    solver.release();
    (event.target as unknown as Element).releasePointerCapture(event.pointerId);
    document.body.style.cursor = "";
  };

  return (
    <group
      ref={meshRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerOver={() => (document.body.style.cursor = "grab")}
      onPointerOut={() => !solver.isGrabbing && (document.body.style.cursor = "")}
    >
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial
          map={texture}
          side={FrontSide}
          envMapIntensity={0.7}
          roughness={surface.roughness}
          // Under the gallery spot full silk sheen washes the photo milky; cap it so the colours stay true.
          sheen={hanging ? Math.min(surface.sheen, 0.2) : surface.sheen}
          sheenRoughness={hanging ? Math.max(surface.sheenRoughness, 0.55) : surface.sheenRoughness}
          sheenColor={hanging ? "#c98f6e" : surface.sheenColor}
          anisotropy={surface.anisotropy}
          anisotropyRotation={Math.PI / 2}
          clearcoat={surface.clearcoat}
          clearcoatRoughness={0.5}
        />
      </mesh>
      {hanging ? (
        // Brass gallery rod the top edge hangs from.
        <mesh
          position={[0, CARPET_HEIGHT / 2 + 0.03, 0.02]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.022, 0.022, width + 0.34, 24]} />
          <meshStandardMaterial color="#c99a45" metalness={0.85} roughness={0.32} />
        </mesh>
      ) : null}
      {/* The reverse has no photo yet, so it is a plain cloth colour: no pattern is invented. */}
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          side={BackSide}
          color="#c9b6a4"
          roughness={0.95}
          envMapIntensity={0.5}
        />
      </mesh>
    </group>
  );
}
