"use client";

import type { Carpet, PileMaterial } from "@farsh/contracts";
import { materialPresets } from "@farsh/contracts";
import { useTexture } from "@react-three/drei";
import { type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
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
import { createKnotNormalMap, KNOTS_PER_NORMAL_TILE } from "../knot-normal-map";

const STEP = 1 / 60;
const CARPET_HEIGHT = 2.2;
const GRID_COLUMNS = 34;
/** Lifts the held point towards the viewer, so a grab reads as picking the carpet up. */
const GRAB_LIFT = 0.25;

interface CarpetClothProps {
  carpet: Carpet;
  material: PileMaterial;
  reducedMotion: boolean;
  /** Pins the top edge, as on a gallery rod; lifting a lower corner shows the knotted back. */
  hanging?: boolean;
  onGrab?: () => void;
}

export function CarpetCloth({
  carpet,
  material,
  reducedMotion,
  hanging = false,
  onGrab,
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
  const normalMap = useMemo(() => {
    const map = createKnotNormalMap(surface.handKnotted);
    const repeat = surface.knotsAcross / KNOTS_PER_NORMAL_TILE;
    map.repeat.set(repeat, repeat / carpet.imageAspect);
    map.anisotropy = maxAnisotropy;
    return map;
  }, [surface.handKnotted, surface.knotsAcross, carpet.imageAspect, maxAnisotropy]);

  // A separate map instance for the reverse, so each material owns and disposes its own texture.
  const backNormalMap = useMemo(() => {
    const map = createKnotNormalMap(surface.handKnotted);
    const repeat = surface.knotsAcross / KNOTS_PER_NORMAL_TILE;
    map.repeat.set(repeat, repeat / carpet.imageAspect);
    map.anisotropy = maxAnisotropy;
    return map;
  }, [surface.handKnotted, surface.knotsAcross, carpet.imageAspect, maxAnisotropy]);

  useEffect(() => {
    solver.setHanging(hanging);
  }, [solver, hanging]);

  useEffect(() => {
    solver.impulse(material === "machine" ? 0.01 : 0.03);
  }, [solver, material]);
  useEffect(() => () => normalMap.dispose(), [normalMap]);
  useEffect(() => () => backNormalMap.dispose(), [backNormalMap]);

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
          normalMap={normalMap}
          normalScale={[surface.normalScale, surface.normalScale]}
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
      {/* The reverse has no pile: flatter colour, no sheen, knots in relief. */}
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          map={texture}
          side={BackSide}
          color="#c9b6a4"
          roughness={0.95}
          envMapIntensity={0.5}
          normalMap={backNormalMap}
          normalScale={[1.1, 1.1]}
        />
      </mesh>
    </group>
  );
}
