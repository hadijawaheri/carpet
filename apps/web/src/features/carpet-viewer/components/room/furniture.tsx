"use client";

import { RoundedBox } from "@react-three/drei";
import { createContext, use, useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  type Group,
  type Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
} from "three";

import type { RoomDimensions, RoomType } from "../../room/room-config";
import { type FurnitureItem, furnitureSize } from "../../room/room-layout";
import { seededRandom } from "../../room/seeded-random";
import { useHideWithWall, wallFacing } from "./hide-from-outside";

/**
 * Furniture is modelled to real dimensions from simple solids. It stays deliberately quiet
 * (linen, walnut, brass) so the carpet is the one patterned thing in the room.
 */
interface Palette {
  fabric: Material;
  cushion: Material;
  accent: Material;
  walnut: Material;
  oak: Material;
  brass: Material;
  blackMetal: Material;
  marble: Material;
  ceramic: Material;
  terracotta: Material;
  leaf: Material;
  leafDark: Material;
  linen: Material;
  leather: Material;
  paper: Material;
  books: Material[];
  art: MeshStandardMaterial;
}

const fabricByRoom: Record<RoomType, { fabric: string; cushion: string; accent: string }> = {
  living: { fabric: "#d6cab8", cushion: "#e4dacb", accent: "#9b5b3c" },
  salon: { fabric: "#e8dfcf", cushion: "#f0e8da", accent: "#6b4a2a" },
  bedroom: { fabric: "#c7b8a3", cushion: "#f2eee7", accent: "#a2603f" },
  dining: { fabric: "#cfc2ae", cushion: "#ddd2c1", accent: "#7d6a4f" },
  office: { fabric: "#7a4b30", cushion: "#8a5a3c", accent: "#3d4a3a" },
};

const PaletteContext = createContext<Palette | null>(null);

function usePalette() {
  const palette = use(PaletteContext);
  if (!palette) throw new Error("Furniture must render inside FurnitureSet");
  return palette;
}

function createArtTexture(seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is not available");
  const random = seededRandom(seed);
  // A quiet abstract in plaster tones: wide washes and one dark arc, nothing that reads as a rug.
  context.fillStyle = "#e9e1d3";
  context.fillRect(0, 0, 256, 192);
  const washes = ["#d8c6ab", "#c9b08d", "#b8c0b4", "#e2d3bd"];
  for (let i = 0; i < 6; i++) {
    context.fillStyle = washes[i % washes.length]!;
    context.globalAlpha = 0.35 + random() * 0.3;
    context.beginPath();
    context.ellipse(
      random() * 256,
      random() * 192,
      40 + random() * 90,
      30 + random() * 50,
      random() * 3,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.globalAlpha = 0.85;
  context.strokeStyle = "#3b332b";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(70 + random() * 110, 150, 60 + random() * 30, Math.PI * 1.1, Math.PI * 1.85);
  context.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function FurnitureSet({
  type,
  items,
  night,
  room,
}: {
  type: RoomType;
  items: FurnitureItem[];
  night: boolean;
  room: RoomDimensions;
}) {
  const colours = fabricByRoom[type];
  const palette = useMemo<Palette>(() => {
    const standard = (color: string, roughness: number, metalness = 0) =>
      new MeshStandardMaterial({ color, roughness, metalness });
    const cloth = (color: string) =>
      new MeshPhysicalMaterial({
        color,
        roughness: 0.92,
        sheen: 0.6,
        sheenRoughness: 0.8,
        sheenColor: "#ffffff",
      });
    return {
      fabric: type === "office" ? standard(colours.fabric, 0.45) : cloth(colours.fabric),
      cushion: type === "office" ? standard(colours.cushion, 0.5) : cloth(colours.cushion),
      accent: cloth(colours.accent),
      walnut: standard("#5a3a27", 0.55),
      oak: standard("#b48c60", 0.6),
      brass: standard("#c3a05a", 0.32, 1),
      blackMetal: standard("#262422", 0.45, 0.6),
      marble: new MeshPhysicalMaterial({ color: "#ece8e1", roughness: 0.18, clearcoat: 0.6 }),
      ceramic: standard("#dcd4c6", 0.4),
      terracotta: standard("#a5644a", 0.85),
      leaf: standard("#46603a", 0.7),
      leafDark: standard("#2f4529", 0.7),
      linen: cloth("#f1ece2"),
      leather: standard("#2e2a27", 0.5),
      paper: standard("#efe9dc", 0.9),
      books: ["#7d3b2e", "#2f4b5b", "#b59a6a", "#4b5a3c", "#d8cfbd", "#5d4a3b", "#8a8076"].map(
        (c) => standard(c, 0.8),
      ),
      art: new MeshStandardMaterial({ map: createArtTexture(type.length * 977), roughness: 0.9 }),
    };
  }, [type, colours]);

  useEffect(
    () => () => {
      for (const value of Object.values(palette)) {
        for (const material of ([] as Material[]).concat(value)) {
          (material as MeshStandardMaterial).map?.dispose();
          material.dispose();
        }
      }
    },
    [palette],
  );

  return (
    <PaletteContext value={palette}>
      {items.map((item, i) =>
        item.kind === "wall-art" ? (
          <WallMounted key={`${item.kind}-${i}`} item={item} room={room} />
        ) : (
          <group
            key={`${item.kind}-${i}`}
            position={[item.x, 0, item.z]}
            rotation={[0, item.rotation, 0]}
          >
            <Piece item={item} night={night} ceiling={room.height} />
          </group>
        ),
      )}
    </PaletteContext>
  );
}

function WallMounted({ item, room }: { item: FurnitureItem; room: RoomDimensions }) {
  const ref = useRef<Group>(null);
  useHideWithWall(ref, wallFacing(item.rotation), room);
  return (
    <group ref={ref} position={[item.x, 0, item.z]} rotation={[0, item.rotation, 0]}>
      <WallArt width={item.width ?? furnitureSize["wall-art"].width} y={item.y ?? 1.6} />
    </group>
  );
}

function Piece({ item, night, ceiling }: { item: FurnitureItem; night: boolean; ceiling: number }) {
  const size = furnitureSize[item.kind];
  const width = item.width ?? size.width;
  const depth = item.depth ?? size.depth;
  switch (item.kind) {
    case "sofa":
      return <Sofa width={width} />;
    case "armchair":
      return <Armchair />;
    case "coffee-table":
      return <CoffeeTable width={width} depth={depth} />;
    case "side-table":
      return <SideTable />;
    case "floor-lamp":
      return <FloorLamp night={night} />;
    case "plant":
      return <Plant seed={Math.round(item.x * 100 + item.z * 10)} />;
    case "sideboard":
      return <Sideboard width={width} />;
    case "bookshelf":
      return <Bookshelf width={width} />;
    case "wall-art":
      return null;
    case "bed":
      return <Bed width={width} />;
    case "nightstand":
      return <Nightstand night={night} />;
    case "bench":
      return <Bench width={width} />;
    case "dining-table":
      return <DiningTable width={width} depth={depth} />;
    case "dining-chair":
      return <DiningChair />;
    case "desk":
      return <Desk night={night} />;
    case "office-chair":
      return <OfficeChair />;
    case "chandelier":
      return <Chandelier ceiling={ceiling} night={night} />;
    case "pendant":
      return <Pendant hang={item.y ?? ceiling - 0.9} ceiling={ceiling} night={night} />;
  }
}

function Part({
  material,
  args,
  position,
  rotation,
  radius = 0.02,
  cast = true,
}: {
  material: Material;
  args: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  cast?: boolean;
}) {
  return (
    <RoundedBox
      args={args}
      radius={Math.min(radius, ...args.map((a) => a / 2 - 0.001))}
      smoothness={3}
      position={position}
      rotation={rotation}
      material={material}
      castShadow={cast}
      receiveShadow
    />
  );
}

function Legs({
  width,
  depth,
  height,
  inset = 0.06,
  radius = 0.018,
  material,
}: {
  width: number;
  depth: number;
  height: number;
  inset?: number;
  radius?: number;
  material: Material;
}) {
  const xs = [-width / 2 + inset, width / 2 - inset];
  const zs = [-depth / 2 + inset, depth / 2 - inset];
  return (
    <>
      {xs.flatMap((x) =>
        zs.map((z) => (
          <mesh key={`${x}-${z}`} position={[x, height / 2, z]} material={material} castShadow>
            <cylinderGeometry args={[radius, radius * 0.75, height, 10]} />
          </mesh>
        )),
      )}
    </>
  );
}

function Sofa({ width }: { width: number }) {
  const p = usePalette();
  const depth = 0.95;
  const leg = 0.1;
  const arm = 0.2;
  const inner = width - arm * 2;
  const seats = inner > 1.7 ? 3 : 2;
  const seatWidth = inner / seats;
  return (
    <group>
      <Legs width={width - 0.1} depth={depth - 0.1} height={leg} material={p.walnut} />
      <Part
        material={p.fabric}
        args={[width, 0.24, depth]}
        position={[0, leg + 0.12, 0]}
        radius={0.04}
      />
      {Array.from({ length: seats }, (_, i) => (
        <group key={i} position={[-inner / 2 + seatWidth * (i + 0.5), 0, 0]}>
          <Part
            material={p.cushion}
            args={[seatWidth - 0.01, 0.15, 0.66]}
            position={[0, leg + 0.31, 0.1]}
            radius={0.06}
          />
          <Part
            material={p.cushion}
            args={[seatWidth - 0.02, 0.44, 0.2]}
            position={[0, leg + 0.56, -0.31]}
            rotation={[-0.14, 0, 0]}
            radius={0.08}
          />
        </group>
      ))}
      <Part
        material={p.fabric}
        args={[width, 0.5, 0.16]}
        position={[0, leg + 0.45, -depth / 2 + 0.08]}
        radius={0.05}
      />
      {[-1, 1].map((side) => (
        <Part
          key={side}
          material={p.fabric}
          args={[arm, 0.56, depth]}
          position={[side * (width / 2 - arm / 2), leg + 0.28, 0]}
          radius={0.07}
        />
      ))}
      <Part
        material={p.accent}
        args={[0.42, 0.4, 0.13]}
        position={[-inner / 2 + 0.3, leg + 0.55, -0.16]}
        rotation={[-0.25, 0.25, 0.05]}
        radius={0.06}
      />
    </group>
  );
}

function Armchair() {
  const p = usePalette();
  const width = 0.82;
  const depth = 0.85;
  const leg = 0.14;
  return (
    <group>
      <Legs
        width={width - 0.12}
        depth={depth - 0.12}
        height={leg}
        material={p.walnut}
        radius={0.015}
      />
      <Part
        material={p.fabric}
        args={[width, 0.2, depth]}
        position={[0, leg + 0.1, 0]}
        radius={0.04}
      />
      <Part
        material={p.cushion}
        args={[width - 0.3, 0.13, 0.6]}
        position={[0, leg + 0.26, 0.08]}
        radius={0.05}
      />
      <Part
        material={p.fabric}
        args={[width, 0.52, 0.16]}
        position={[0, leg + 0.42, -depth / 2 + 0.08]}
        rotation={[-0.08, 0, 0]}
        radius={0.06}
      />
      {[-1, 1].map((side) => (
        <Part
          key={side}
          material={p.fabric}
          args={[0.15, 0.42, depth]}
          position={[side * (width / 2 - 0.075), leg + 0.25, 0]}
          radius={0.06}
        />
      ))}
    </group>
  );
}

function CoffeeTable({ width, depth }: { width: number; depth: number }) {
  const p = usePalette();
  return (
    <group>
      <Part
        material={p.walnut}
        args={[width - 0.3, 0.34, depth - 0.24]}
        position={[0, 0.17, 0]}
        radius={0.03}
      />
      <Part
        material={p.marble}
        args={[width, 0.05, depth]}
        position={[0, 0.375, 0]}
        radius={0.015}
      />
      <Books position={[-width / 4, 0.4, 0]} />
      <mesh position={[width / 4, 0.47, 0.02]} material={p.ceramic} castShadow>
        <cylinderGeometry args={[0.06, 0.045, 0.14, 24]} />
      </mesh>
    </group>
  );
}

function Books({ position }: { position: [number, number, number] }) {
  const p = usePalette();
  return (
    <group position={position}>
      <Part
        material={p.books[1]!}
        args={[0.28, 0.035, 0.21]}
        position={[0, 0.0175, 0]}
        radius={0.004}
      />
      <Part
        material={p.books[4]!}
        args={[0.25, 0.03, 0.19]}
        position={[0.01, 0.05, 0]}
        rotation={[0, 0.15, 0]}
        radius={0.004}
      />
    </group>
  );
}

function SideTable() {
  const p = usePalette();
  return (
    <group>
      <mesh position={[0, 0.27, 0]} material={p.brass} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.52, 12]} />
      </mesh>
      <mesh position={[0, 0.01, 0]} material={p.brass} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.02, 32]} />
      </mesh>
      <mesh position={[0, 0.535, 0]} material={p.marble} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 40]} />
      </mesh>
      <mesh position={[0, 0.63, 0]} material={p.terracotta} castShadow>
        <sphereGeometry args={[0.08, 24, 16]} />
      </mesh>
    </group>
  );
}

function LampGlow({
  y,
  intensity,
  distance = 6,
}: {
  y: number;
  intensity: number;
  distance?: number;
}) {
  return (
    <pointLight
      position={[0, y, 0]}
      color="#ffc98e"
      intensity={intensity}
      distance={distance}
      decay={2}
    />
  );
}

function FloorLamp({ night }: { night: boolean }) {
  const p = usePalette();
  return (
    <group>
      <mesh position={[0, 0.012, 0]} material={p.blackMetal} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.16, 0.024, 32]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} material={p.brass} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 1.42, 10]} />
      </mesh>
      <mesh position={[0, 1.42, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.21, 0.32, 40, 1, true]} />
        <ShadeMaterial night={night} />
      </mesh>
      <LampGlow y={1.38} intensity={night ? 3.5 : 0} />
    </group>
  );
}

function Plant({ seed }: { seed: number }) {
  const p = usePalette();
  const leaves = useMemo(() => {
    const random = seededRandom(seed + 17);
    return Array.from({ length: 26 }, (_, i) => {
      const height = 0.55 + (i / 26) * 0.85 + random() * 0.1;
      const angle = i * 2.4 + random() * 0.6;
      const reach = 0.08 + random() * 0.18 + (1 - i / 26) * 0.08;
      return {
        position: [Math.cos(angle) * reach, height, Math.sin(angle) * reach] as [
          number,
          number,
          number,
        ],
        rotation: [0.6 + random() * 0.6, -angle + Math.PI / 2, 0] as [number, number, number],
        dark: random() > 0.55,
        scale: 0.85 + random() * 0.4,
      };
    });
  }, [seed]);
  return (
    <group>
      <mesh position={[0, 0.2, 0]} material={p.terracotta} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.16, 0.4, 32]} />
      </mesh>
      <mesh position={[0, 0.8, 0]} material={p.walnut} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 1.0, 8]} />
      </mesh>
      {leaves.map((leaf, i) => (
        <mesh
          key={i}
          position={leaf.position}
          rotation={leaf.rotation}
          scale={[0.11 * leaf.scale, 0.02, 0.16 * leaf.scale]}
          material={leaf.dark ? p.leafDark : p.leaf}
          castShadow
        >
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function Sideboard({ width }: { width: number }) {
  const p = usePalette();
  const height = 0.72;
  const doors = Math.max(2, Math.round(width / 0.5));
  return (
    <group>
      <Legs
        width={width - 0.08}
        depth={0.37}
        height={0.1}
        material={p.blackMetal}
        radius={0.012}
        inset={0.04}
      />
      <Part
        material={p.walnut}
        args={[width, height, 0.45]}
        position={[0, 0.1 + height / 2, 0]}
        radius={0.01}
      />
      {Array.from({ length: doors - 1 }, (_, i) => (
        <mesh
          key={i}
          position={[-width / 2 + (width / doors) * (i + 1), 0.1 + height / 2, 0.226]}
          material={p.blackMetal}
        >
          <boxGeometry args={[0.004, height - 0.06, 0.002]} />
        </mesh>
      ))}
      <mesh position={[width * 0.3, 0.1 + height + 0.16, 0]} material={p.ceramic} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.32, 24]} />
      </mesh>
      <Books position={[-width * 0.25, 0.1 + height, 0]} />
      <mesh position={[-width * 0.05, 0.1 + height + 0.12, -0.05]} material={p.brass} castShadow>
        <sphereGeometry args={[0.05, 20, 14]} />
      </mesh>
    </group>
  );
}

function Bookshelf({ width }: { width: number }) {
  const p = usePalette();
  const height = 2.1;
  const depth = 0.36;
  const shelves = 5;
  const books = useMemo(() => {
    const random = seededRandom(width * 1000 + 5);
    const rows: { x: number; y: number; w: number; h: number; m: number; lean: number }[] = [];
    for (let shelf = 0; shelf < shelves; shelf++) {
      let x = -width / 2 + 0.06;
      const y = 0.08 + (shelf * (height - 0.1)) / shelves + 0.02;
      // Leave gaps on some shelves for objects, the way a lived-in shelf looks.
      const stop = width / 2 - 0.06 - (shelf % 2 === 0 ? width * 0.3 : 0.05);
      while (x < stop) {
        const w = 0.025 + random() * 0.035;
        const h = 0.2 + random() * 0.14;
        rows.push({
          x: x + w / 2,
          y,
          w,
          h,
          m: Math.floor(random() * 7),
          lean: random() < 0.06 ? 0.2 : 0,
        });
        x += w + 0.002;
      }
    }
    return rows;
  }, [width]);
  return (
    <group>
      <Part
        material={p.oak}
        args={[width, height, 0.02]}
        position={[0, height / 2, -depth / 2 + 0.01]}
        radius={0.005}
      />
      {[-1, 1].map((side) => (
        <Part
          key={side}
          material={p.oak}
          args={[0.03, height, depth]}
          position={[side * (width / 2 - 0.015), height / 2, 0]}
          radius={0.005}
        />
      ))}
      {Array.from({ length: shelves + 1 }, (_, i) => (
        <Part
          key={i}
          material={p.oak}
          args={[width, 0.03, depth]}
          position={[0, 0.06 + (i * (height - 0.1)) / shelves, 0]}
          radius={0.005}
        />
      ))}
      {books.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.y + b.h / 2, 0.02]}
          rotation={[0, 0, b.lean]}
          material={p.books[b.m]!}
          castShadow
        >
          <boxGeometry args={[b.w, b.h, 0.22]} />
        </mesh>
      ))}
    </group>
  );
}

function WallArt({ width, y }: { width: number; y: number }) {
  const p = usePalette();
  const height = width * 0.72;
  return (
    <group position={[0, y, 0.025]}>
      <Part material={p.walnut} args={[width, height, 0.035]} position={[0, 0, 0]} radius={0.004} />
      <mesh position={[0, 0, 0.019]} material={p.art}>
        <planeGeometry args={[width - 0.08, height - 0.08]} />
      </mesh>
    </group>
  );
}

function Bed({ width }: { width: number }) {
  const p = usePalette();
  const length = 2.12;
  return (
    <group>
      <Legs
        width={width + 0.04}
        depth={length - 0.1}
        height={0.1}
        material={p.walnut}
        inset={0.05}
      />
      <Part
        material={p.fabric}
        args={[width + 0.1, 0.24, length - 0.08]}
        position={[0, 0.22, 0.04]}
        radius={0.04}
      />
      <Part
        material={p.linen}
        args={[width, 0.24, 1.98]}
        position={[0, 0.46, 0.05]}
        radius={0.06}
      />
      <Part
        material={p.linen}
        args={[width + 0.06, 0.06, 1.45]}
        position={[0, 0.6, 0.33]}
        radius={0.03}
      />
      <Part
        material={p.accent}
        args={[width + 0.1, 0.035, 0.52]}
        position={[0, 0.645, 0.72]}
        radius={0.015}
      />
      <Part
        material={p.fabric}
        args={[width + 0.24, 1.1, 0.1]}
        position={[0, 0.55, -length / 2 + 0.05]}
        radius={0.05}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Part
            material={p.cushion}
            args={[0.62, 0.16, 0.42]}
            position={[side * width * 0.24, 0.66, -0.78]}
            rotation={[-0.5, 0, 0]}
            radius={0.07}
          />
          <Part
            material={p.linen}
            args={[0.55, 0.13, 0.36]}
            position={[side * width * 0.24, 0.66, -0.62]}
            rotation={[-0.35, 0, 0]}
            radius={0.06}
          />
        </group>
      ))}
    </group>
  );
}

function TableLamp({ night }: { night: boolean }) {
  const p = usePalette();
  return (
    <group>
      <mesh position={[0, 0.13, 0]} material={p.ceramic} castShadow>
        <sphereGeometry args={[0.1, 24, 18]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.22, 32, 1, true]} />
        <ShadeMaterial night={night} />
      </mesh>
      <LampGlow y={0.34} intensity={night ? 2 : 0} distance={4} />
    </group>
  );
}

function Nightstand({ night }: { night: boolean }) {
  const p = usePalette();
  return (
    <group>
      <Part material={p.walnut} args={[0.5, 0.5, 0.42]} position={[0, 0.3, 0]} radius={0.01} />
      <Legs
        width={0.46}
        depth={0.38}
        height={0.05}
        material={p.blackMetal}
        inset={0.03}
        radius={0.01}
      />
      <mesh position={[0, 0.32, 0.211]} material={p.blackMetal}>
        <boxGeometry args={[0.46, 0.004, 0.002]} />
      </mesh>
      <group position={[0, 0.55, 0]}>
        <TableLamp night={night} />
      </group>
    </group>
  );
}

function Bench({ width }: { width: number }) {
  const p = usePalette();
  return (
    <group>
      <Legs
        width={width}
        depth={0.42}
        height={0.36}
        material={p.walnut}
        inset={0.05}
        radius={0.016}
      />
      <Part material={p.cushion} args={[width, 0.1, 0.42]} position={[0, 0.41, 0]} radius={0.04} />
    </group>
  );
}

function DiningTable({ width, depth }: { width: number; depth: number }) {
  const p = usePalette();
  return (
    <group>
      <Legs
        width={width - 0.08}
        depth={depth - 0.12}
        height={0.72}
        material={p.walnut}
        inset={0.05}
        radius={0.03}
      />
      <Part
        material={p.walnut}
        args={[width, 0.045, depth]}
        position={[0, 0.7425, 0]}
        radius={0.012}
      />
      <mesh position={[0, 0.84, 0]} material={p.ceramic} castShadow>
        <cylinderGeometry args={[0.16, 0.09, 0.14, 32]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, 0.88, side * depth * 0.28]} material={p.brass} castShadow>
          <cylinderGeometry args={[0.035, 0.05, 0.22, 20]} />
        </mesh>
      ))}
    </group>
  );
}

function DiningChair() {
  const p = usePalette();
  return (
    <group>
      <Legs
        width={0.44}
        depth={0.46}
        height={0.44}
        material={p.walnut}
        inset={0.03}
        radius={0.014}
      />
      <Part material={p.cushion} args={[0.48, 0.07, 0.5]} position={[0, 0.47, 0]} radius={0.025} />
      <Part
        material={p.fabric}
        args={[0.46, 0.42, 0.06]}
        position={[0, 0.74, -0.23]}
        rotation={[-0.08, 0, 0]}
        radius={0.025}
      />
    </group>
  );
}

function Desk({ night }: { night: boolean }) {
  const p = usePalette();
  return (
    <group>
      <Legs
        width={1.56}
        depth={0.72}
        height={0.73}
        material={p.blackMetal}
        inset={0.04}
        radius={0.016}
      />
      <Part material={p.walnut} args={[1.6, 0.04, 0.78]} position={[0, 0.75, 0]} radius={0.01} />
      <Part material={p.walnut} args={[0.42, 0.5, 0.7]} position={[0.55, 0.48, 0]} radius={0.01} />
      <group position={[0, 0.77, 0.08]} rotation={[0, Math.PI, 0]}>
        <Part
          material={p.blackMetal}
          args={[0.34, 0.012, 0.24]}
          position={[0, 0.006, 0]}
          radius={0.004}
        />
        <Part
          material={p.blackMetal}
          args={[0.34, 0.22, 0.01]}
          position={[0, 0.12, -0.12]}
          rotation={[-0.25, 0, 0]}
          radius={0.004}
        />
      </group>
      <Part
        material={p.paper}
        args={[0.21, 0.01, 0.3]}
        position={[-0.4, 0.775, 0]}
        rotation={[0, 0.2, 0]}
        radius={0.002}
      />
      <group position={[-0.62, 0.77, -0.2]}>
        <TableLamp night={night} />
      </group>
    </group>
  );
}

function OfficeChair() {
  const p = usePalette();
  return (
    <group>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          position={[0, 0.06, 0]}
          rotation={[0, (i / 5) * Math.PI * 2, 0]}
          material={p.blackMetal}
          castShadow
        >
          <boxGeometry args={[0.04, 0.03, 0.6]} />
        </mesh>
      ))}
      <mesh position={[0, 0.26, 0]} material={p.blackMetal} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.38, 12]} />
      </mesh>
      <Part material={p.leather} args={[0.56, 0.09, 0.54]} position={[0, 0.48, 0]} radius={0.04} />
      <Part
        material={p.leather}
        args={[0.52, 0.6, 0.08]}
        position={[0, 0.84, -0.27]}
        rotation={[-0.12, 0, 0]}
        radius={0.04}
      />
    </group>
  );
}

function Chandelier({ ceiling, night }: { ceiling: number; night: boolean }) {
  const p = usePalette();
  const drop = Math.min(1.1, ceiling - 2.3);
  const ringY = ceiling - drop;
  const arms = 8;
  return (
    <group>
      <mesh position={[0, ceiling - drop / 2, 0]} material={p.brass}>
        <cylinderGeometry args={[0.008, 0.008, drop, 8]} />
      </mesh>
      <mesh position={[0, ringY, 0]} rotation={[Math.PI / 2, 0, 0]} material={p.brass} castShadow>
        <torusGeometry args={[0.38, 0.012, 10, 64]} />
      </mesh>
      <mesh position={[0, ringY - 0.06, 0]} material={p.brass} castShadow>
        <sphereGeometry args={[0.07, 20, 14]} />
      </mesh>
      {Array.from({ length: arms }, (_, i) => {
        const angle = (i / arms) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(angle) * 0.38, ringY, Math.sin(angle) * 0.38]}>
            <mesh position={[0, 0.05, 0]} material={p.paper}>
              <cylinderGeometry args={[0.012, 0.012, 0.1, 10]} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.022, 12, 10]} />
              <BulbMaterial night={night} />
            </mesh>
          </group>
        );
      })}
      <pointLight
        position={[0, ringY - 0.05, 0]}
        color="#ffcf96"
        intensity={night ? 14 : 0}
        distance={9}
        decay={2}
      />
    </group>
  );
}

function Pendant({ hang, ceiling, night }: { hang: number; ceiling: number; night: boolean }) {
  const p = usePalette();
  const drop = ceiling - hang;
  return (
    <group>
      <mesh position={[0, hang + drop / 2, 0]} material={p.blackMetal}>
        <cylinderGeometry args={[0.004, 0.004, drop, 6]} />
      </mesh>
      <mesh position={[0, hang, 0]} material={p.brass} castShadow>
        <sphereGeometry args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, hang - 0.02, 0]}>
        <sphereGeometry args={[0.05, 16, 12]} />
        <BulbMaterial night={night} />
      </mesh>
      <LampGlow y={hang - 0.1} intensity={night ? 3.5 : 0} />
    </group>
  );
}

function ShadeMaterial({ night }: { night: boolean }) {
  return (
    <meshStandardMaterial
      color="#f2eadb"
      roughness={0.95}
      emissive="#ffcf8f"
      emissiveIntensity={night ? 0.9 : 0}
    />
  );
}

function BulbMaterial({ night }: { night: boolean }) {
  return (
    <meshStandardMaterial color="#fff6e5" emissive="#ffd9a0" emissiveIntensity={night ? 3 : 0.2} />
  );
}
