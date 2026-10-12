"use client";

import type { Carpet, CurtainItem, PaintingItem } from "@farsh/contracts";
import { useTexture } from "@react-three/drei";
import { type ReactNode, Suspense, useEffect, useMemo } from "react";
import { DoubleSide, PlaneGeometry, SRGBColorSpace, type Texture } from "three";

import { mixHex } from "@/lib/color";

import { frameDepth, paintingDimensions, WINDOW } from "../data/catalog";
import { woodGrain } from "../three/textures";

/** How far each frame stands off the wall. */
const frameProud: Record<PaintingItem["frame"], number> = {
  none: 0.032,
  thin: 0.03,
  wood: 0.045,
  gold: 0.06,
};

function FrameMaterial({ item }: { item: PaintingItem }) {
  if (item.frame === "wood") {
    return <meshStandardMaterial color={item.frameColor} map={woodGrain()} roughness={0.5} />;
  }
  if (item.frame === "gold") {
    return <meshStandardMaterial color={item.frameColor} metalness={0.75} roughness={0.36} />;
  }
  return <meshStandardMaterial color={item.frameColor} metalness={0.1} roughness={0.45} />;
}

/** Four bars around a picture of `width` × `height` (outer size). */
function Bars({
  width,
  height,
  bar,
  depth,
  z = 0,
  children,
}: {
  width: number;
  height: number;
  bar: number;
  depth: number;
  z?: number;
  children: ReactNode;
}) {
  const inner = height - 2 * bar;
  const bars = [
    { w: width, h: bar, x: 0, y: height / 2 - bar / 2 },
    { w: width, h: bar, x: 0, y: -height / 2 + bar / 2 },
    { w: bar, h: inner, x: -width / 2 + bar / 2, y: 0 },
    { w: bar, h: inner, x: width / 2 - bar / 2, y: 0 },
  ];
  return (
    <>
      {bars.map((b) => (
        <mesh key={`${b.x}-${b.y}`} position={[b.x, b.y, z + depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, depth]} />
          {children}
        </mesh>
      ))}
    </>
  );
}

/** Two colour fields and a band: an abstract print that takes the room's palette. */
function ColorArt({ item, width, height }: { item: PaintingItem; width: number; height: number }) {
  const soft = mixHex(item.fill, item.accent, 0.4);
  return (
    <group>
      <mesh receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={item.fill} roughness={0.9} />
      </mesh>
      <mesh position={[width * 0.06, -height * 0.1, 0.001]}>
        <planeGeometry args={[width * 0.62, height * 0.46]} />
        <meshStandardMaterial color={item.accent} roughness={0.9} />
      </mesh>
      <mesh position={[-width * 0.12, height * 0.26, 0.002]}>
        <planeGeometry args={[width * 0.42, height * 0.2]} />
        <meshStandardMaterial color={soft} roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Crops a picture to fill the frame, as a framer would, instead of stretching it. */
function coverFit(texture: Texture, aspect: number) {
  const image = texture.image as { width?: number; height?: number } | undefined;
  const imageAspect = image?.width && image.height ? image.width / image.height : aspect;
  if (imageAspect > aspect) {
    texture.repeat.set(aspect / imageAspect, 1);
    texture.offset.set((1 - aspect / imageAspect) / 2, 0);
  } else {
    texture.repeat.set(1, imageAspect / aspect);
    texture.offset.set(0, (1 - imageAspect / aspect) / 2);
  }
}

function PictureArt({
  url,
  width,
  height,
  woven,
}: {
  url: string;
  width: number;
  height: number;
  woven: boolean;
}) {
  const texture = useTexture(url, (loaded) => {
    loaded.colorSpace = SRGBColorSpace;
    // A tableau already has the frame's proportions; the visitor's own picture is cropped to them.
    if (!woven) coverFit(loaded, width / height);
  });
  return (
    <mesh receiveShadow>
      <planeGeometry args={[width, height]} />
      {/* Wool pile scatters light; a print behind glass is smoother. */}
      <meshStandardMaterial map={texture} roughness={woven ? 0.95 : 0.7} />
    </mesh>
  );
}

interface PaintingProps {
  item: PaintingItem;
  /** The visitor's own picture, as an object URL that never leaves their device. */
  imageUrl?: string;
  /** The carpet photo hung as a tableau. */
  carpet?: Carpet;
}

/**
 * A framed picture. Local +z faces into the room; the group sits on the wall.
 * The thin frame has a white mat, as prints are usually framed; a carpet tableau goes edge to edge.
 */
export function Painting({ item, imageUrl, carpet }: PaintingProps) {
  const woven = item.art === "carpet" && carpet !== undefined;
  const { width, height } = paintingDimensions(item, woven ? carpet.imageAspect : undefined);
  const bar = frameDepth[item.frame];
  const proud = frameProud[item.frame];
  const innerW = width - 2 * bar;
  const innerH = height - 2 * bar;
  const mat = item.frame === "thin" && !woven ? Math.min(innerW, innerH) * 0.11 : 0;
  const artW = innerW - 2 * mat;
  const artH = innerH - 2 * mat;
  // The picture sits a little behind the frame's face, so the frame throws a fine shadow on it.
  const face = item.frame === "none" ? proud : proud * 0.55;
  const url = woven ? carpet.image : item.art === "photo" ? imageUrl : undefined;
  const colors = <ColorArt item={item} width={artW} height={artH} />;

  return (
    <group>
      {/* Backing board: the canvas edge for an unframed piece, the mat for a framed print. */}
      <mesh position={[0, 0, face / 2]} castShadow receiveShadow>
        <boxGeometry args={[innerW, innerH, face]} />
        <meshStandardMaterial
          color={mat > 0 ? "#f3efe7" : woven ? "#e9dfcf" : item.fill}
          roughness={0.95}
        />
      </mesh>
      {item.frame !== "none" ? (
        <Bars width={width} height={height} bar={bar} depth={proud}>
          <FrameMaterial item={item} />
        </Bars>
      ) : null}
      {item.frame === "gold" ? (
        // A raised inner lip, the step a carved gilt frame has before the picture.
        <Bars width={innerW + 0.024} height={innerH + 0.024} bar={0.018} depth={proud + 0.008}>
          <meshStandardMaterial
            color={mixHex(item.frameColor, "#fff3d0", 0.25)}
            metalness={0.8}
            roughness={0.3}
          />
        </Bars>
      ) : null}
      <group position={[0, 0, face + 0.001]}>
        {url ? (
          <Suspense fallback={colors}>
            <PictureArt url={url} width={artW} height={artH} woven={woven} />
          </Suspense>
        ) : (
          colors
        )}
      </group>
    </group>
  );
}

const PLEATS = 7;

/** A hanging panel: a plane waved across its width so the fabric reads as gathered, not flat. */
function usePleatedPanel(width: number, height: number, depth: number) {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(width, height, PLEATS * 8, 8);
    const position = g.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      // Deeper folds toward the bottom, as a hung curtain relaxes; none at the rod.
      const y = position.getY(i);
      const relax = 0.55 + 0.45 * (0.5 - y / height);
      position.setZ(i, Math.sin((x / width) * PLEATS * Math.PI * 2) * depth * relax);
    }
    g.computeVertexNormals();
    return g;
  }, [width, height, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

function CurtainPanel({
  width,
  height,
  color,
  sheer,
}: {
  width: number;
  height: number;
  color: string;
  sheer: boolean;
}) {
  const geometry = usePleatedPanel(width, height, sheer ? 0.022 : 0.035);
  return (
    <mesh geometry={geometry} castShadow={!sheer} receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={0.95}
        side={DoubleSide}
        transparent={sheer}
        opacity={sheer ? 0.55 : 1}
        depthWrite={!sheer}
      />
    </mesh>
  );
}

interface CurtainProps {
  item: CurtainItem;
  roomHeight: number;
  /** Sky colour through the glass, from the time of day. */
  glass: string;
}

/** A window with a rod and two curtain panels. Sheer voile is drawn half across; heavy drapes stand open. */
export function Curtain({ item, roomHeight, glass }: CurtainProps) {
  const sheer = item.fabric === "sheer";
  const rodY = Math.min(roomHeight - 0.18, WINDOW.sill + WINDOW.height + WINDOW.rodDrop + 0.1);
  const span = item.width + 2 * WINDOW.rodOverhang;
  const panelWidth = sheer ? item.width / 2 + 0.1 : WINDOW.rodOverhang + 0.08;
  const hang = rodY - 0.04;
  const panelX = sheer ? item.width / 4 + 0.05 : item.width / 2 + panelWidth / 2 - 0.08;
  const midY = WINDOW.sill + WINDOW.height / 2;

  return (
    <group>
      {/* Window: the sky in a white frame, set into the wall, with a sill. */}
      <mesh position={[0, midY, 0.004]}>
        <planeGeometry args={[item.width, WINDOW.height]} />
        <meshBasicMaterial color={glass} toneMapped={false} />
      </mesh>
      {[
        { w: item.width + 0.08, h: 0.04, x: 0, y: WINDOW.sill + WINDOW.height + 0.02, d: 0.04 },
        { w: item.width + 0.16, h: 0.035, x: 0, y: WINDOW.sill - 0.018, d: 0.1 },
        { w: 0.04, h: WINDOW.height, x: -item.width / 2 - 0.02, y: midY, d: 0.04 },
        { w: 0.04, h: WINDOW.height, x: item.width / 2 + 0.02, y: midY, d: 0.04 },
        { w: 0.025, h: WINDOW.height, x: 0, y: midY, d: 0.03 },
        { w: item.width, h: 0.025, x: 0, y: midY + WINDOW.height * 0.18, d: 0.03 },
      ].map((bar) => (
        <mesh
          key={`${bar.x}-${bar.y}-${bar.w}`}
          position={[bar.x, bar.y, bar.d / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[bar.w, bar.h, bar.d]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.6} />
        </mesh>
      ))}
      {/* Rod on two brackets, with a finial at each end. */}
      <mesh position={[0, rodY, 0.1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, span + 0.12, 16]} />
        <meshStandardMaterial color="#b89a5e" metalness={0.7} roughness={0.35} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (span / 2 + 0.07), rodY, 0.1]} castShadow>
            <sphereGeometry args={[0.03, 16, 12]} />
            <meshStandardMaterial color="#b89a5e" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[side * (span / 2 - 0.05), rodY, 0.05]}>
            <boxGeometry args={[0.02, 0.02, 0.1]} />
            <meshStandardMaterial color="#b89a5e" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * panelX, rodY - hang / 2 - 0.02, 0.12]}>
          <CurtainPanel width={panelWidth} height={hang} color={item.color} sheer={sheer} />
        </group>
      ))}
    </group>
  );
}
