"use client";

import type { CurtainItem, PaintingItem } from "@farsh/contracts";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { DoubleSide, PlaneGeometry, SRGBColorSpace } from "three";

import { mixHex } from "@/lib/color";

import { paintingDimensions, WINDOW } from "../data/catalog";

const FRAME = 0.035;

/**
 * A painting of two colour fields, or the visitor's own picture when they add one.
 * Local +z faces into the room; the group sits at the wall.
 */
export function Painting({ item, imageUrl }: { item: PaintingItem; imageUrl?: string }) {
  const { width, height } = paintingDimensions(item);
  const innerW = width - 2 * FRAME;
  const innerH = height - 2 * FRAME;
  const soft = mixHex(item.fill, item.accent, 0.4);

  return (
    <group>
      {/* Frame: four bars, so the canvas can sit a little proud of the wall. */}
      {[
        { w: width, h: FRAME, x: 0, y: height / 2 - FRAME / 2 },
        { w: width, h: FRAME, x: 0, y: -height / 2 + FRAME / 2 },
        { w: FRAME, h: innerH, x: -width / 2 + FRAME / 2, y: 0 },
        { w: FRAME, h: innerH, x: width / 2 - FRAME / 2, y: 0 },
      ].map((bar) => (
        <mesh key={`${bar.x}-${bar.y}`} position={[bar.x, bar.y, 0.025]} castShadow receiveShadow>
          <boxGeometry args={[bar.w, bar.h, 0.05]} />
          <meshStandardMaterial color={item.frameColor} roughness={0.55} />
        </mesh>
      ))}
      {imageUrl ? (
        <UploadedCanvas url={imageUrl} width={innerW} height={innerH} />
      ) : (
        <group position={[0, 0, 0.012]}>
          <mesh receiveShadow>
            <planeGeometry args={[innerW, innerH]} />
            <meshStandardMaterial color={item.fill} roughness={0.9} />
          </mesh>
          <mesh position={[innerW * 0.06, -innerH * 0.1, 0.002]}>
            <planeGeometry args={[innerW * 0.62, innerH * 0.46]} />
            <meshStandardMaterial color={item.accent} roughness={0.9} />
          </mesh>
          <mesh position={[-innerW * 0.12, innerH * 0.26, 0.004]}>
            <planeGeometry args={[innerW * 0.42, innerH * 0.2]} />
            <meshStandardMaterial color={soft} roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function UploadedCanvas({ url, width, height }: { url: string; width: number; height: number }) {
  const texture = useTexture(url, (loaded) => {
    loaded.colorSpace = SRGBColorSpace;
  });
  return (
    <mesh position={[0, 0, 0.012]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} roughness={0.85} />
    </mesh>
  );
}

const PLEATS = 7;

/** A hanging panel: a plane waved across its width so the fabric reads as gathered, not flat. */
function usePleatedPanel(width: number, height: number) {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(width, height, PLEATS * 8, 6);
    const position = g.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      // Deeper folds toward the bottom, as a hung curtain relaxes; none at the rod.
      const y = position.getY(i);
      const relax = 0.55 + 0.45 * (0.5 - y / height);
      position.setZ(i, Math.sin((x / width) * PLEATS * Math.PI * 2) * 0.035 * relax);
    }
    g.computeVertexNormals();
    return g;
  }, [width, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

function CurtainPanel({ width, height, color }: { width: number; height: number; color: string }) {
  const geometry = usePleatedPanel(width, height);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.95} side={DoubleSide} />
    </mesh>
  );
}

/** A window with a rod and two curtain panels. The visitor sets the window's width and the fabric's colour. */
export function Curtain({ item, roomHeight }: { item: CurtainItem; roomHeight: number }) {
  const rodY = Math.min(roomHeight - 0.18, WINDOW.sill + WINDOW.height + WINDOW.rodDrop + 0.1);
  const span = item.width + 2 * WINDOW.rodOverhang;
  const panelWidth = WINDOW.rodOverhang + 0.08;
  const hang = rodY - 0.04;
  const gap = item.width;

  return (
    <group>
      {/* Window: pale glass in a white frame, set into the wall. */}
      <mesh position={[0, WINDOW.sill + WINDOW.height / 2, 0.004]}>
        <planeGeometry args={[item.width, WINDOW.height]} />
        <meshBasicMaterial color="#eaf2ff" toneMapped={false} />
      </mesh>
      {[
        { w: item.width + 0.08, h: 0.04, x: 0, y: WINDOW.sill + WINDOW.height + 0.02 },
        { w: item.width + 0.08, h: 0.06, x: 0, y: WINDOW.sill - 0.03 },
        {
          w: 0.04,
          h: WINDOW.height,
          x: -item.width / 2 - 0.02,
          y: WINDOW.sill + WINDOW.height / 2,
        },
        { w: 0.04, h: WINDOW.height, x: item.width / 2 + 0.02, y: WINDOW.sill + WINDOW.height / 2 },
        { w: 0.025, h: WINDOW.height, x: 0, y: WINDOW.sill + WINDOW.height / 2 },
        { w: item.width, h: 0.025, x: 0, y: WINDOW.sill + WINDOW.height / 2 },
      ].map((bar) => (
        <mesh key={`${bar.x}-${bar.y}-${bar.w}`} position={[bar.x, bar.y, 0.02]} receiveShadow>
          <boxGeometry args={[bar.w, bar.h, 0.04]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.6} />
        </mesh>
      ))}
      {/* Rod, with a finial at each end. */}
      <mesh position={[0, rodY, 0.1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, span + 0.12, 16]} />
        <meshStandardMaterial color="#b89a5e" metalness={0.7} roughness={0.35} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (span / 2 + 0.07), rodY, 0.1]} castShadow>
          <sphereGeometry args={[0.03, 16, 12]} />
          <meshStandardMaterial color="#b89a5e" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * (gap / 2 + panelWidth / 2 - 0.08), rodY - hang / 2 - 0.02, 0.12]}
        >
          <CurtainPanel width={panelWidth} height={hang} color={item.color} />
        </group>
      ))}
    </group>
  );
}
