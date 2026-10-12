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
  DoubleSide,
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
/** On the floor a held point rises this high (metres), about a hand's reach when folding a rug. */
const FLOOR_LIFT = 0.3;
/**
 * The reverse of a knotted carpet shows the same design, mirrored and flatter, because every knot passes
 * through to the back. Until photos of real backs arrive, the back is the front photo seen from behind
 * (which mirrors it), muted: nothing is drawn that is not in the owner's photo.
 */
const BACK_TINT = "#b3a597";
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
  /** Pins the top edge, as on a gallery rod; lifting a lower corner shows the reverse. */
  hanging?: boolean;
  /** Lies on a floor at the group's origin; it stays wherever it is left, folds included. Mutually exclusive with hanging. */
  lying?: boolean;
  /** Height of the carpet in world units; the width follows the photo. */
  heightUnits?: number;
  /** When false the carpet ignores the pointer, so the surrounding scene can use it (selecting, orbiting). */
  interactive?: boolean;
  onGrab?: () => void;
  onGrabEnd?: () => void;
  /** Filled with a function that kicks the cloth; the stage's button calls it. Null while motion is reduced. */
  shakeRef?: RefObject<(() => void) | null>;
  /** Filled with a function that lays the carpet flat again, for a rug left folded on the floor. */
  flattenRef?: RefObject<(() => void) | null>;
}

/** Indices of the grid's edge particles, in order around the sheet. */
function perimeter(cols: number, rows: number) {
  const ring: number[] = [];
  for (let c = 0; c < cols; c++) ring.push(c);
  for (let r = 1; r < rows; r++) ring.push(r * cols + cols - 1);
  for (let c = cols - 2; c >= 0; c--) ring.push((rows - 1) * cols + c);
  for (let r = rows - 2; r > 0; r--) ring.push(r * cols);
  ring.push(0);
  return ring;
}

export function CarpetCloth({
  carpet,
  material,
  reducedMotion,
  hanging = false,
  lying = false,
  heightUnits = CARPET_HEIGHT,
  interactive = true,
  onGrab,
  onGrabEnd,
  shakeRef,
  flattenRef,
}: CarpetClothProps) {
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const texture = useTexture(carpet.image, (loaded) => {
    loaded.colorSpace = SRGBColorSpace;
    loaded.anisotropy = maxAnisotropy;
  });
  const camera = useThree((s) => s.camera);
  const meshRef = useRef<Group>(null);
  const width = heightUnits * carpet.imageAspect;

  const solver = useMemo(
    () => new ClothSolver(width, heightUnits, GRID_COLUMNS),
    [width, heightUnits],
  );
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
  const pile = preset.physics.pileHeight;

  // The pile's thickness, seen at the rug's edge: a band from the top surface down along each edge normal.
  const ring = useMemo(() => perimeter(solver.cols, solver.rows), [solver]);
  const edge = useMemo(() => {
    const g = new BufferGeometry();
    const count = ring.length;
    g.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(count * 2 * 3), 3).setUsage(DynamicDrawUsage),
    );
    const uv = new Float32Array(count * 2 * 2);
    ring.forEach((p, k) => {
      for (const layer of [0, 1]) {
        uv[(k * 2 + layer) * 2] = solver.uvs[p * 2]!;
        uv[(k * 2 + layer) * 2 + 1] = solver.uvs[p * 2 + 1]!;
      }
    });
    g.setAttribute("uv", new BufferAttribute(uv, 2));
    const index: number[] = [];
    for (let k = 0; k < count - 1; k++) {
      const a = k * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    g.setIndex(index);
    return g;
  }, [ring, solver]);
  useEffect(() => () => edge.dispose(), [edge]);

  useEffect(() => {
    solver.setHanging(hanging);
    solver.setFloor(lying, pile);
  }, [solver, hanging, lying, pile]);

  useEffect(() => {
    if (!flattenRef) return;
    flattenRef.current = () => solver.flatten();
    return () => {
      flattenRef.current = null;
    };
  }, [flattenRef, solver]);

  // A hanging carpet sways when its pile changes. One on the floor stays put: with nothing pulling it back,
  // the ripple would be left in it as wrinkles.
  useEffect(() => {
    if (reducedMotion || lying) return;
    solver.impulse(material === "machine" ? 0.01 : 0.03);
  }, [solver, material, reducedMotion, lying]);

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
  const settled = useRef(false);
  useFrame((_, delta) => {
    accumulated.current += Math.min(delta, 0.05);
    while (accumulated.current >= STEP) {
      elapsed.current += STEP;
      solver.step(STEP, elapsed.current, preset.physics, !reducedMotion);
      accumulated.current -= STEP;
    }
    // A sleeping rug has not moved since the last upload; skip the normals and the edge band.
    if (solver.isAsleep && settled.current) return;
    settled.current = solver.isAsleep;
    const position = geometry.getAttribute("position");
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    if (!lying) return;
    const normal = geometry.getAttribute("normal");
    const band = edge.getAttribute("position");
    const out = band.array as Float32Array;
    const p = solver.positions;
    ring.forEach((i, k) => {
      const o = k * 6;
      out[o] = p[i * 3]!;
      out[o + 1] = p[i * 3 + 1]!;
      out[o + 2] = p[i * 3 + 2]!;
      out[o + 3] = p[i * 3]! - normal.getX(i) * pile;
      out[o + 4] = p[i * 3 + 1]! - normal.getY(i) * pile;
      out[o + 5] = p[i * 3 + 2]! - normal.getZ(i) * pile;
    });
    band.needsUpdate = true;
    edge.computeVertexNormals();
    edge.computeBoundingSphere();
  });

  const dragPlane = useMemo(() => new Plane(), []);
  const hit = useMemo(() => new Vector3(), []);

  const toLocal = (point: Vector3) => meshRef.current?.worldToLocal(point.clone());

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (reducedMotion || !interactive) return;
    event.stopPropagation();
    const local = toLocal(event.point);
    const group = meshRef.current;
    if (!local || !group) return;
    solver.grabNearest(local.x, local.y, local.z);
    if (lying) {
      // On the floor the hand moves in a level plane a reach above the rug, whatever the camera angle.
      const up = new Vector3(0, 0, 1).transformDirection(group.matrixWorld);
      dragPlane.setFromNormalAndCoplanarPoint(
        up,
        group.localToWorld(new Vector3(0, 0, FLOOR_LIFT)),
      );
      if (event.ray.intersectPlane(dragPlane, hit)) {
        const start = toLocal(hit);
        if (start) solver.moveTarget(start.x, start.y, FLOOR_LIFT);
      }
    } else {
      dragPlane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new Vector3()).negate(),
        event.point,
      );
    }
    (event.target as unknown as Element).setPointerCapture(event.pointerId);
    document.body.style.cursor = "grabbing";
    onGrab?.();
  };
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!solver.isGrabbing || !event.ray.intersectPlane(dragPlane, hit)) return;
    const local = toLocal(hit);
    if (!local) return;
    if (lying) solver.moveTarget(local.x, local.y, FLOOR_LIFT);
    else solver.moveTarget(local.x, local.y, local.z + GRAB_LIFT);
  };
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!solver.isGrabbing) return;
    solver.release();
    (event.target as unknown as Element).releasePointerCapture(event.pointerId);
    document.body.style.cursor = "";
    onGrabEnd?.();
  };

  return (
    <group
      ref={meshRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerOver={() => {
        if (interactive && !reducedMotion) document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        if (!solver.isGrabbing) document.body.style.cursor = "";
      }}
    >
      {/* On the floor the top surface sits one pile height up, so the edge band reaches down to the boards. */}
      <group position={[0, 0, lying ? pile : 0]}>
        <mesh geometry={geometry} castShadow receiveShadow={lying}>
          <meshPhysicalMaterial
            map={texture}
            side={FrontSide}
            envMapIntensity={0.7}
            roughness={surface.roughness}
            // Under the gallery spot full silk sheen washes the photo milky; cap it so the colours stay true.
            sheen={hanging || lying ? Math.min(surface.sheen, 0.2) : surface.sheen}
            sheenRoughness={
              hanging || lying ? Math.max(surface.sheenRoughness, 0.55) : surface.sheenRoughness
            }
            sheenColor={hanging || lying ? "#c98f6e" : surface.sheenColor}
            anisotropy={surface.anisotropy}
            anisotropyRotation={Math.PI / 2}
            clearcoat={surface.clearcoat}
            clearcoatRoughness={0.5}
          />
        </mesh>
        {/* The back: the photo seen from behind is the design mirrored, as on a knotted carpet's reverse. */}
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial
            side={BackSide}
            map={texture}
            color={BACK_TINT}
            roughness={0.97}
            envMapIntensity={0.4}
          />
        </mesh>
        {lying ? (
          <mesh geometry={edge} castShadow receiveShadow>
            <meshStandardMaterial map={texture} color={BACK_TINT} roughness={1} side={DoubleSide} />
          </mesh>
        ) : null}
      </group>
      {hanging ? (
        // Brass gallery rod the top edge hangs from.
        <mesh
          position={[0, heightUnits / 2 + 0.03, 0.02]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.022, 0.022, width + 0.34, 24]} />
          <meshStandardMaterial color="#c99a45" metalness={0.85} roughness={0.32} />
        </mesh>
      ) : null}
    </group>
  );
}
