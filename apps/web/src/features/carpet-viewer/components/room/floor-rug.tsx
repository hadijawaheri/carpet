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
  type Group,
  type Mesh,
  Plane,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";

import { createKnotNormalMap, KNOTS_PER_NORMAL_TILE } from "../../knot-normal-map";
import { averageEdgeColor, createFringeTexture } from "../../room/room-textures";
import type { RugPlacement } from "../../room/rug-placement";
import { createRugGrid, unrollProgress, unrollRug } from "../../room/rug-unroll";

/** Pile height in metres: silk is clipped short, wool stands tallest. */
const PILE: Record<PileMaterial, number> = { silk: 0.006, wool: 0.013, machine: 0.009 };
const UNROLL_SECONDS = 2.2;
const DRAG_LIFT = 0.05;
const FRINGE = 0.075;

interface FloorRugProps {
  carpet: Carpet;
  material: PileMaterial;
  placement: RugPlacement;
  reducedMotion: boolean;
}

interface Controls {
  enabled: boolean;
}

/** The owner's carpet photo at its true size, lying on the floor; drag to move it. */
export function FloorRug({ carpet, material, placement, reducedMotion }: FloorRugProps) {
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const getState = useThree((s) => s.get);
  const texture = useTexture(carpet.image, (loaded) => {
    loaded.colorSpace = SRGBColorSpace;
    loaded.anisotropy = maxAnisotropy;
  });
  const width = carpet.widthCm / 100;
  const length = carpet.lengthCm / 100;
  const pile = PILE[material];
  const surface = materialPresets[material].surface;

  const grid = useMemo(() => createRugGrid(width, length, 28), [width, length]);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(grid.positions, 3).setUsage(DynamicDrawUsage));
    g.setAttribute("uv", new BufferAttribute(grid.uvs, 2));
    g.setIndex(new BufferAttribute(grid.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [grid]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const normalMap = useMemo(() => {
    const map = createKnotNormalMap(surface.handKnotted);
    // Real knot count across the width, so the pile grain is to scale with the room.
    const knotsAcross = density(carpet) * width;
    const repeat = Math.max(8, knotsAcross / KNOTS_PER_NORMAL_TILE);
    map.repeat.set(repeat, (repeat * length) / width);
    map.anisotropy = maxAnisotropy;
    return map;
  }, [surface.handKnotted, carpet, width, length, maxAnisotropy]);
  useEffect(() => () => normalMap.dispose(), [normalMap]);

  const fringe = useMemo(() => {
    const map = createFringeTexture();
    map.repeat.set(width / 0.5, 1);
    return map;
  }, [width]);
  useEffect(() => () => fringe.dispose(), [fringe]);

  const edgeColor = useMemo(() => averageEdgeColor(texture.image as CanvasImageSource), [texture]);

  const group = useRef<Group>(null);
  const sides = useRef<Mesh>(null);
  const fringes = useRef<Group>(null);
  const elapsed = useRef(reducedMotion ? UNROLL_SECONDS : 0);
  const shown = useRef({ angle: placement.quarterTurns * (Math.PI / 2), lift: 0, placed: false });

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;
    const motion = shown.current;
    if (elapsed.current < UNROLL_SECONDS) {
      elapsed.current += Math.min(delta, 0.05);
      unrollRug(grid, unrollProgress(elapsed.current, UNROLL_SECONDS), pile);
      geometry.getAttribute("position").needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
    const flat = elapsed.current >= UNROLL_SECONDS;
    if (sides.current) sides.current.visible = flat;
    if (fringes.current) fringes.current.visible = flat;

    const ease = (rate: number) => 1 - Math.exp(-delta * rate);
    if (!motion.placed) {
      node.position.set(placement.x, 0, placement.z);
      motion.placed = true;
    }
    const follow = placement.dragging || reducedMotion ? 1 : ease(10);
    node.position.x += (placement.x - node.position.x) * follow;
    node.position.z += (placement.z - node.position.z) * follow;
    motion.lift += ((placement.dragging ? DRAG_LIFT : 0) - motion.lift) * ease(14);
    node.position.y = motion.lift;

    const target = placement.quarterTurns * (Math.PI / 2);
    const nearest = target + Math.PI * 2 * Math.round((motion.angle - target) / (Math.PI * 2));
    motion.angle += (nearest - motion.angle) * (reducedMotion ? 1 : ease(7));
    node.rotation.y = motion.angle;

    // The canvas renders on demand; keep frames coming only while something still moves.
    const moving =
      !flat ||
      Math.abs(placement.x - node.position.x) > 1e-4 ||
      Math.abs(placement.z - node.position.z) > 1e-4 ||
      Math.abs(nearest - motion.angle) > 1e-4 ||
      motion.lift > 1e-4 ||
      placement.dragging;
    if (moving) state.invalidate();
  });

  // Moves made from the panel (keys, buttons) happen outside the canvas; wake it for them.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => placement.subscribe(() => invalidate()), [placement, invalidate]);

  const floor = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new Vector3(), []);
  const grab = useMemo(() => new Vector2(), []);

  // The camera must not orbit while the carpet is being dragged across the floor.
  const setOrbit = (enabled: boolean) => {
    const controls = getState().controls as unknown as Controls | null;
    if (controls) controls.enabled = enabled;
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!event.ray.intersectPlane(floor, hit)) return;
    grab.set(placement.x - hit.x, placement.z - hit.z);
    placement.startDrag();
    setOrbit(false);
    (event.target as unknown as Element).setPointerCapture(event.pointerId);
    document.body.style.cursor = "grabbing";
  };
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!placement.dragging || !event.ray.intersectPlane(floor, hit)) return;
    placement.dragTo(hit.x + grab.x, hit.z + grab.y);
  };
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!placement.dragging) return;
    placement.endDrag();
    setOrbit(true);
    (event.target as unknown as Element).releasePointerCapture(event.pointerId);
    document.body.style.cursor = "grab";
  };

  return (
    <group ref={group}>
      <mesh
        geometry={geometry}
        position={[0, pile, 0]}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerOver={() => (document.body.style.cursor = "grab")}
        onPointerOut={() => !placement.dragging && (document.body.style.cursor = "")}
      >
        <meshPhysicalMaterial
          map={texture}
          roughness={Math.max(0.55, surface.roughness)}
          sheen={Math.min(surface.sheen, 0.35)}
          sheenRoughness={surface.sheenRoughness}
          sheenColor={surface.sheenColor}
          normalMap={normalMap}
          normalScale={[surface.normalScale * 1.4, surface.normalScale * 1.4]}
          envMapIntensity={0.5}
        />
      </mesh>
      {/* The reverse, seen on the roll: flat weave, no pile. */}
      <mesh geometry={geometry} position={[0, pile, 0]}>
        <meshStandardMaterial map={texture} color="#b9a896" roughness={0.95} side={BackSide} />
      </mesh>
      <mesh ref={sides} position={[0, (pile - 0.001) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, pile - 0.001, length]} />
        <meshStandardMaterial color={edgeColor} roughness={0.95} />
      </mesh>
      <group ref={fringes}>
        {[-1, 1].map((end) => (
          <mesh
            key={end}
            position={[0, 0.0015, end * (length / 2 + FRINGE / 2)]}
            // The knotted band sits against the carpet edge, the strands point away.
            rotation={[-Math.PI / 2, 0, end < 0 ? Math.PI : 0]}
            receiveShadow
          >
            <planeGeometry args={[width, FRINGE]} />
            <meshStandardMaterial map={fringe} alphaTest={0.4} roughness={0.95} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Knots per metre across the carpet, from the trade unit it is sold in. */
function density(carpet: Carpet) {
  if (!carpet.density) return 300;
  if (carpet.density.unit === "raj") return carpet.density.value / 0.07;
  return carpet.density.value;
}
