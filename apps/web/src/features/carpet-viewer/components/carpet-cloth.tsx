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
import type { RackArm } from "../rack-arm";

const STEP = 1 / 60;
export const CARPET_HEIGHT = 2.2;
const GRID_COLUMNS = 34;
/** Several carpets share a rack, so each gets a coarser grid. */
const RACK_GRID_COLUMNS = 24;
/** Lifts the held point towards the viewer, so a grab reads as picking the carpet up. */
const GRAB_LIFT = 0.25;

interface CarpetClothProps {
  carpet: Carpet;
  material: PileMaterial;
  reducedMotion: boolean;
  /** Pins the top edge, as on a gallery rod; lifting a lower corner shows the knotted back. */
  hanging?: boolean;
  /** Softer wind, for a carpet that floats as a page centrepiece rather than one being studied. */
  calm?: boolean;
  /** Hangs the carpet from this rack arm instead of a fixed rod; the rack draws the arm itself. */
  arm?: RackArm;
  /** Distance from the carpet's centre to the rack pole, along its width. */
  pivotX?: number;
  /** False for carpets waiting on the rack: a press picks them instead of grabbing the cloth. */
  grabbable?: boolean;
  onSelect?: () => void;
  onGrab?: () => void;
}

export function CarpetCloth({
  carpet,
  material,
  reducedMotion,
  hanging = false,
  calm = false,
  arm,
  pivotX = 0,
  grabbable = true,
  onSelect,
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

  const solver = useMemo(() => {
    const cloth = new ClothSolver(width, CARPET_HEIGHT, arm ? RACK_GRID_COLUMNS : GRID_COLUMNS);
    if (arm) {
      cloth.setHanging(true);
      cloth.setAnchor(arm.angle, pivotX);
      cloth.placeAtAnchor();
    }
    return cloth;
  }, [width, arm, pivotX]);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(solver.positions, 3).setUsage(DynamicDrawUsage));
    g.setAttribute("uv", new BufferAttribute(solver.uvs, 2));
    g.setIndex(new BufferAttribute(solver.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [solver]);
  const preset = materialPresets[material];
  const physics = useMemo(
    () => (calm ? { ...preset.physics, wind: preset.physics.wind * 0.4 } : preset.physics),
    [calm, preset.physics],
  );
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
    solver.setHanging(hanging || arm !== undefined);
  }, [solver, hanging, arm]);

  // A new pile is felt as a small shake; skipped on mount so carpets waiting on a rack hang still.
  const shownMaterial = useRef(material);
  useEffect(() => {
    if (shownMaterial.current === material) return;
    shownMaterial.current = material;
    solver.impulse(material === "machine" ? 0.01 : 0.03);
  }, [solver, material]);
  useEffect(() => () => normalMap.dispose(), [normalMap]);
  useEffect(() => () => backNormalMap.dispose(), [backNormalMap]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const accumulated = useRef(0);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    accumulated.current += Math.min(delta, 0.05);
    let moved = false;
    while (accumulated.current >= STEP) {
      elapsed.current += STEP;
      accumulated.current -= STEP;
      if (arm) {
        arm.update(STEP);
        if (reducedMotion) arm.snap();
        solver.setAnchor(arm.angle, pivotX);
        // A carpet resting on the rack costs nothing until its arm moves again.
        if (!arm.active && !solver.isGrabbing) continue;
      }
      solver.step(STEP, elapsed.current, physics, !reducedMotion);
      moved = true;
    }
    if (!moved) return;
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
    if (!grabbable) {
      onSelect?.();
      return;
    }
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
      onPointerOver={() => (document.body.style.cursor = grabbable ? "grab" : "pointer")}
      onPointerOut={() => !solver.isGrabbing && (document.body.style.cursor = "")}
    >
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial
          map={texture}
          side={FrontSide}
          envMapIntensity={0.7}
          roughness={surface.roughness}
          // Full silk sheen washes the photo gold on cream and milky under the spot; cap it so colours stay true.
          // On the rack the sheen is the point: silk has to flash against wool as it swings.
          sheen={Math.min(surface.sheen, arm ? 0.6 : 0.35)}
          sheenRoughness={surface.sheenRoughness}
          sheenColor={hanging && !arm ? "#f4e8d5" : surface.sheenColor}
          anisotropy={surface.anisotropy}
          anisotropyRotation={Math.PI / 2}
          clearcoat={surface.clearcoat}
          clearcoatRoughness={0.5}
          normalMap={normalMap}
          normalScale={[surface.normalScale, surface.normalScale]}
        />
      </mesh>
      {hanging && !arm ? (
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
