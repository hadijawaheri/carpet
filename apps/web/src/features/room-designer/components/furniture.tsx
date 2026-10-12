"use client";

import type {
  CabinetItem,
  FloorItem,
  LampItem,
  PlantItem,
  PoufItem,
  SofaItem,
  TableItem,
} from "@farsh/contracts";
import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { DoubleSide, LatheGeometry, Shape, ShapeGeometry, Vector2 } from "three";

import { mixHex } from "@/lib/color";

import {
  cabinetShapes,
  CHAIR,
  LAMP,
  plantSizes,
  POUF,
  SOFA,
  tableDimensions,
} from "../data/catalog";
import { cushionColor } from "../state/room-reducer";
import { fabricBump, hashId, seeded, woodGrain } from "../three/textures";

/** Upholstery: matte, with a woven bump so a sofa reads as cloth at arm's length. */
function Fabric({ color }: { color: string }) {
  return (
    <meshStandardMaterial color={color} roughness={0.96} bumpMap={fabricBump()} bumpScale={0.6} />
  );
}

function Wood({ color, roughness = 0.5 }: { color: string; roughness?: number }) {
  return <meshStandardMaterial color={color} map={woodGrain()} roughness={roughness} />;
}

function Metal({ color }: { color: string }) {
  return <meshStandardMaterial color={color} metalness={0.85} roughness={0.32} />;
}

interface Box {
  size: [number, number, number];
  at: [number, number, number];
  radius?: number;
  rotation?: [number, number, number];
}

function Padded({ size, at, radius = 0.05, rotation, color }: Box & { color: string }) {
  return (
    <RoundedBox
      args={size}
      radius={Math.min(radius, Math.min(...size) / 2 - 0.001)}
      smoothness={4}
      position={at}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <Fabric color={color} />
    </RoundedBox>
  );
}

/**
 * A sofa at real scale. Its front faces +z and its origin is the middle of the main body on the floor.
 * Modern: square arms on slim tapered legs. Classic: rolled arms, a skirt and a buttoned back.
 * A chaise extends the seat at one end into an L.
 */
export function Sofa({ item }: { item: SofaItem }) {
  const { seatWidth: sw, arm, depth, legHeight, seatTop, backTop, chaiseLength } = SOFA;
  const classic = item.style === "classic";
  const width = item.seats * sw + 2 * arm;
  const baseTop = legHeight + 0.2;
  const cushion = cushionColor(item.color);
  const pillow = mixHex(item.color, "#ffffff", 0.42);
  const seatX = (i: number) => -((item.seats - 1) * sw) / 2 + i * sw;
  // Sitting on the sofa you face +z, so your left hand is on the +x side.
  const chaiseSide = item.chaise === "left" ? 1 : item.chaise === "right" ? -1 : 0;
  const chaiseSeat = chaiseSide === 0 ? -1 : chaiseSide > 0 ? item.seats - 1 : 0;
  const armTop = classic ? 0.6 : 0.62;
  const front = depth / 2;
  const chaiseFront = -depth / 2 + chaiseLength;

  return (
    <group>
      {/* Frame under the cushions, with the chaise's extension. */}
      <Padded
        size={[width, baseTop - legHeight, depth]}
        at={[0, (legHeight + baseTop) / 2, 0]}
        color={item.color}
        radius={0.03}
      />
      {chaiseSide !== 0 ? (
        <Padded
          size={[sw + arm, baseTop - legHeight, chaiseLength - depth + 0.02]}
          at={[
            chaiseSide * (width / 2 - (sw + arm) / 2),
            (legHeight + baseTop) / 2,
            (front + chaiseFront) / 2,
          ]}
          color={item.color}
          radius={0.03}
        />
      ) : null}

      {/* Seat cushions: one per seat, puffed, with a hair of gap between them. */}
      {Array.from({ length: item.seats }, (_, i) => {
        const long = i === chaiseSeat;
        const d = long ? chaiseLength - 0.24 : depth - 0.24;
        const z = long ? -depth / 2 + 0.2 + d / 2 : 0.08;
        return (
          <Padded
            key={`seat-${i}`}
            size={[sw - 0.015, seatTop - baseTop + 0.02, d]}
            at={[seatX(i), (baseTop + seatTop) / 2, z]}
            color={cushion}
            radius={0.07}
          />
        );
      })}

      {/* Back. */}
      <Padded
        size={[width - 2 * arm + 0.02, backTop - baseTop + (classic ? 0.06 : 0), 0.18]}
        at={[0, (baseTop + backTop + (classic ? 0.06 : 0)) / 2, -depth / 2 + 0.09]}
        color={item.color}
        radius={classic ? 0.08 : 0.04}
      />
      {classic
        ? // A tight buttoned back instead of loose cushions.
          Array.from({ length: item.seats * 2 }, (_, i) =>
            [0.62, 0.76].map((y) => (
              <mesh
                key={`button-${i}-${y}`}
                position={[-((item.seats * 2 - 1) * sw) / 4 + (i * sw) / 2, y, -depth / 2 + 0.185]}
              >
                <sphereGeometry args={[0.012, 10, 8]} />
                <meshStandardMaterial color={mixHex(item.color, "#000000", 0.35)} roughness={0.8} />
              </mesh>
            )),
          )
        : Array.from({ length: item.seats }, (_, i) => (
            <Padded
              key={`back-${i}`}
              size={[sw - 0.04, backTop - seatTop - 0.02, 0.16]}
              at={[seatX(i), (seatTop + backTop) / 2 - 0.02, -depth / 2 + 0.26]}
              rotation={[-0.18, 0, 0]}
              color={cushion}
              radius={0.07}
            />
          ))}

      {/* Arms. The chaise side's arm runs the chaise's length. */}
      {[-1, 1].map((side) => {
        const long = side === chaiseSide;
        const d = long ? chaiseLength : depth;
        const z = long ? -depth / 2 + chaiseLength / 2 : 0;
        const x = side * (width / 2 - arm / 2);
        return classic ? (
          <group key={`arm-${side}`}>
            <Padded
              size={[arm, armTop - legHeight - 0.08, d]}
              at={[x, (legHeight + armTop - 0.08) / 2, z]}
              color={item.color}
              radius={0.03}
            />
            {/* The roll along the arm's top, and its scroll at the front. */}
            <mesh
              position={[x + side * 0.02, armTop - 0.05, z]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[0.1, 0.1, d, 24]} />
              <Fabric color={item.color} />
            </mesh>
          </group>
        ) : (
          <Padded
            key={`arm-${side}`}
            size={[arm, armTop - legHeight, d]}
            at={[x, (legHeight + armTop) / 2, z]}
            color={item.color}
            radius={0.04}
          />
        );
      })}

      {/* Scatter cushions at the two ends. */}
      {item.seats >= 2
        ? [-1, 1].map((side) => (
            <Padded
              key={`pillow-${side}`}
              size={[0.42, 0.4, 0.13]}
              at={[side * (width / 2 - arm - 0.24), seatTop + 0.19, -depth / 2 + 0.38]}
              rotation={[-0.25, side * 0.35, side * 0.12]}
              color={pillow}
              radius={0.06}
            />
          ))
        : null}

      {classic ? (
        <>
          {/* A skirt down to the floor hides all but small turned feet. */}
          <mesh position={[0, legHeight - 0.03, front - 0.005]} castShadow>
            <boxGeometry args={[width, 0.1, 0.012]} />
            <Fabric color={item.color} />
          </mesh>
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sz) => (
              <mesh
                key={`foot-${sx}-${sz}`}
                position={[sx * (width / 2 - 0.06), 0.035, sz * (depth / 2 - 0.06)]}
                castShadow
              >
                <sphereGeometry args={[0.035, 16, 12]} />
                <Wood color={item.legColor} roughness={0.4} />
              </mesh>
            )),
          )}
        </>
      ) : (
        [-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => {
            const zEdge = sz > 0 && sx === chaiseSide ? chaiseFront : sz * (depth / 2);
            return (
              <mesh
                key={`leg-${sx}-${sz}`}
                position={[sx * (width / 2 - 0.07), legHeight / 2, zEdge - sz * 0.07]}
                rotation={[sz * 0.12, 0, -sx * 0.12]}
                castShadow
              >
                <cylinderGeometry args={[0.018, 0.011, legHeight + 0.01, 12]} />
                <Wood color={item.legColor} roughness={0.4} />
              </mesh>
            );
          }),
        )
      )}
    </group>
  );
}

const TOP = 0.035;

/** A dining chair facing +z: upholstered seat and back on a wooden frame. */
function Chair({ wood, fabric }: { wood: string; fabric: string }) {
  const { width, depth, seat, back } = CHAIR;
  return (
    <group>
      <Padded
        size={[width, 0.07, depth - 0.04]}
        at={[0, seat - 0.035, 0.02]}
        color={fabric}
        radius={0.025}
      />
      <Padded
        size={[width - 0.04, back - seat - 0.08, 0.06]}
        at={[0, (seat + back) / 2 + 0.02, -depth / 2 + 0.04]}
        rotation={[-0.08, 0, 0]}
        color={fabric}
        radius={0.025}
      />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}-${sz}`}
            position={[sx * (width / 2 - 0.03), (seat - 0.07) / 2, sz * (depth / 2 - 0.04)]}
            castShadow
          >
            <boxGeometry args={[0.035, seat - 0.07, 0.035]} />
            <Wood color={wood} />
          </mesh>
        )),
      )}
      {[-1, 1].map((sx) => (
        <mesh
          key={`post-${sx}`}
          position={[sx * (width / 2 - 0.03), (seat + back) / 2, -depth / 2 + 0.03]}
          castShadow
        >
          <boxGeometry args={[0.03, back - seat, 0.03]} />
          <Wood color={wood} />
        </mesh>
      ))}
    </group>
  );
}

/** Where chairs stand around a dining table: long sides first, then the ends. */
function chairSpots(item: TableItem, width: number, depth: number) {
  const n = item.chairs;
  const reach = CHAIR.reach;
  if (item.shape === "round") {
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const r = width / 2 + reach - 0.08;
      // The chair at angle a looks back towards the middle.
      return { x: Math.sin(a) * r, z: Math.cos(a) * r, rotation: a + Math.PI };
    });
  }
  const perSide = Math.max(1, Math.floor(width / 0.62));
  const ends = Math.min(2, Math.max(0, n - 2 * perSide));
  const sides = n - ends;
  const near = Math.ceil(sides / 2);
  const far = sides - near;
  const row = (count: number, z: number, rotation: number) =>
    Array.from({ length: count }, (_, i) => ({
      x: -width / 2 + (width / count) * (i + 0.5),
      z,
      rotation,
    }));
  return [
    ...row(near, depth / 2 + reach - 0.12, Math.PI),
    ...row(far, -depth / 2 - reach + 0.12, 0),
    ...(ends >= 1 ? [{ x: width / 2 + reach - 0.12, z: 0, rotation: -Math.PI / 2 }] : []),
    ...(ends >= 2 ? [{ x: -width / 2 - reach + 0.12, z: 0, rotation: Math.PI / 2 }] : []),
  ];
}

/** Coffee, side or dining table; a dining table brings its chairs. */
export function Table({ item }: { item: TableItem }) {
  const { width, depth, height } = tableDimensions(item);
  const legHeight = height - TOP;
  const spots = item.height === "dining" ? chairSpots(item, width, depth) : [];

  return (
    <group>
      {item.shape === "round" ? (
        <>
          <mesh position={[0, height - TOP / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[width / 2, width / 2 - 0.008, TOP, 64]} />
            <Wood color={item.color} roughness={0.35} />
          </mesh>
          {item.height === "side" ? (
            // Three splayed legs.
            [0, 1, 2].map((k) => {
              const a = (k / 3) * Math.PI * 2;
              return (
                <mesh
                  key={k}
                  position={[Math.sin(a) * width * 0.28, legHeight / 2, Math.cos(a) * width * 0.28]}
                  rotation={[Math.cos(a) * 0.18, 0, -Math.sin(a) * 0.18]}
                  castShadow
                >
                  <cylinderGeometry args={[0.014, 0.01, legHeight + 0.02, 10]} />
                  <Wood color={item.color} />
                </mesh>
              );
            })
          ) : (
            <>
              <mesh position={[0, legHeight / 2, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.075, legHeight, 32]} />
                <Wood color={item.color} />
              </mesh>
              <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[width * 0.26, width * 0.28, 0.03, 48]} />
                <Wood color={item.color} />
              </mesh>
            </>
          )}
        </>
      ) : (
        <>
          <RoundedBox
            args={[width, TOP, depth]}
            radius={0.01}
            smoothness={3}
            position={[0, height - TOP / 2, 0]}
            castShadow
            receiveShadow
          >
            <Wood color={item.color} roughness={0.35} />
          </RoundedBox>
          {/* Apron under the top, then four legs. */}
          <mesh position={[0, height - TOP - 0.04, 0]} castShadow>
            <boxGeometry args={[width - 0.1, 0.07, depth - 0.1]} />
            <Wood color={item.color} />
          </mesh>
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sz) => (
              <mesh
                key={`leg-${sx}-${sz}`}
                position={[sx * (width / 2 - 0.06), legHeight / 2, sz * (depth / 2 - 0.06)]}
                castShadow
              >
                <boxGeometry args={[0.045, legHeight, 0.045]} />
                <Wood color={item.color} />
              </mesh>
            )),
          )}
          {item.height === "coffee" ? (
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
              <boxGeometry args={[width - 0.1, 0.02, depth - 0.1]} />
              <Wood color={item.color} />
            </mesh>
          ) : null}
        </>
      )}
      {spots.map((spot, i) => (
        <group key={i} position={[spot.x, 0, spot.z]} rotation={[0, spot.rotation, 0]}>
          <Chair wood={item.color} fabric={item.chairColor} />
        </group>
      ))}
    </group>
  );
}

/** A floor lamp. A lit lamp glows, and in the evening and at night it lights the room around it. */
export function Lamp({ item, night }: { item: LampItem; night: number }) {
  const { base, height, shade } = LAMP;
  const shadeHeight = 0.32;
  const geometry = useMemo(
    () =>
      new LatheGeometry(
        [new Vector2(shade / 2, 0), new Vector2(shade / 2 - 0.06, shadeHeight)],
        48,
      ),
    [shade],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  const glow = item.lit ? 0.25 + night * 1.2 : 0;

  return (
    <group>
      <mesh position={[0, 0.012, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[base / 2, base / 2, 0.024, 40]} />
        <Metal color={item.metal} />
      </mesh>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, height - 0.1, 12]} />
        <Metal color={item.metal} />
      </mesh>
      <mesh geometry={geometry} position={[0, height - shadeHeight, 0]} castShadow>
        <meshStandardMaterial
          color={item.color}
          side={DoubleSide}
          roughness={0.9}
          emissive={item.color}
          emissiveIntensity={glow}
          transparent
          opacity={0.96}
        />
      </mesh>
      {item.lit ? (
        <pointLight
          position={[0, height - shadeHeight / 2, 0]}
          color="#ffcf8a"
          intensity={0.6 + night * 5}
          distance={7}
          decay={1.6}
        />
      ) : null}
    </group>
  );
}

/** A potted plant: leaves are flat ovals on a spiral, seeded by the item's id so each plant keeps its shape. */
export function Plant({ item }: { item: PlantItem }) {
  const { pot, height } = plantSizes[item.size];
  const potHeight = pot * 0.95;
  const leaf = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.06, 0.04, 0.07, 0.16, 0, 0.24);
    shape.bezierCurveTo(-0.07, 0.16, -0.06, 0.04, 0, 0);
    return new ShapeGeometry(shape, 8);
  }, []);
  useEffect(() => () => leaf.dispose(), [leaf]);
  const leaves = useMemo(() => {
    const random = seeded(hashId(item.id));
    const count = Math.round(14 + height * 22);
    return Array.from({ length: count }, (_, i) => {
      const t = i / count;
      const y = potHeight + 0.05 + t * (height - potHeight - 0.1);
      const a = i * 2.4 + random() * 0.6;
      const r = 0.04 + random() * 0.06 + (1 - Math.abs(t - 0.6)) * pot * 0.35;
      const scale = 0.7 + random() * 0.7 + (1 - t) * 0.4;
      return {
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        y,
        a,
        tilt: 0.4 + random() * 0.7,
        scale,
        shade: random(),
      };
    });
  }, [item.id, height, potHeight, pot]);

  return (
    <group>
      <mesh position={[0, potHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[pot / 2, pot / 2.6, potHeight, 32]} />
        <meshStandardMaterial color={item.potColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, potHeight - 0.02, 0]}>
        <cylinderGeometry args={[pot / 2 - 0.02, pot / 2 - 0.02, 0.01, 24]} />
        <meshStandardMaterial color="#3a2a1f" roughness={1} />
      </mesh>
      <mesh position={[0, (potHeight + height) / 2 - 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.012, height - potHeight - 0.1, 6]} />
        <meshStandardMaterial color="#4f5a33" roughness={0.9} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh
          key={i}
          geometry={leaf}
          position={[l.x, l.y, l.z]}
          rotation={[l.tilt - Math.PI / 2, -l.a + Math.PI / 2, 0]}
          scale={l.scale}
          castShadow
        >
          <meshStandardMaterial
            color={mixHex("#3f6b3a", "#6f9a4a", l.shade)}
            side={DoubleSide}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Console, TV unit or bookcase against a wall. Its back is at −z, its front faces +z. */
export function Cabinet({ item }: { item: CabinetItem }) {
  const { depth, height } = cabinetShapes[item.variant];
  const w = item.width;
  const doors = Math.max(2, Math.round(w / 0.5));
  const books = useMemo(() => {
    if (item.variant !== "bookcase") return [];
    const random = seeded(hashId(item.id));
    const shelves = 5;
    const out: { x: number; y: number; w: number; h: number; color: string }[] = [];
    for (let s = 0; s < shelves; s++) {
      let x = -w / 2 + 0.04;
      const y = 0.06 + (s * (height - 0.08)) / shelves;
      while (x < w / 2 - 0.12) {
        if (random() < 0.12) {
          x += 0.12;
          continue;
        }
        const bw = 0.02 + random() * 0.03;
        const bh = 0.2 + random() * 0.1;
        out.push({
          x: x + bw / 2,
          y: y + bh / 2,
          w: bw,
          h: bh,
          color: mixHex(
            "#6b4a30",
            ["#2f3f63", "#8a2a2e", "#c9b79c", "#4a7a74", "#2a2a2c"][Math.floor(random() * 5)]!,
            0.7,
          ),
        });
        x += bw + 0.003;
      }
    }
    return out;
  }, [item.variant, item.id, w, height]);

  if (item.variant === "bookcase") {
    const shelves = 5;
    return (
      <group>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * (w / 2 - 0.012), height / 2, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.024, height, depth]} />
            <Wood color={item.color} />
          </mesh>
        ))}
        <mesh position={[0, height / 2, -depth / 2 + 0.006]} receiveShadow>
          <boxGeometry args={[w, height, 0.012]} />
          <Wood color={mixHex(item.color, "#000000", 0.15)} />
        </mesh>
        {Array.from({ length: shelves + 1 }, (_, s) => (
          <mesh
            key={s}
            position={[0, 0.03 + (s * (height - 0.05)) / shelves, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[w - 0.04, 0.024, depth - 0.01]} />
            <Wood color={item.color} />
          </mesh>
        ))}
        {books.map((b, i) => (
          <mesh key={i} position={[b.x, b.y, 0.02]} castShadow>
            <boxGeometry args={[b.w, b.h, depth - 0.1]} />
            <meshStandardMaterial color={b.color} roughness={0.85} />
          </mesh>
        ))}
      </group>
    );
  }

  const legHeight = 0.1;
  const body = height - legHeight;
  return (
    <group>
      <RoundedBox
        args={[w, body, depth]}
        radius={0.008}
        smoothness={3}
        position={[0, legHeight + body / 2, 0]}
        castShadow
        receiveShadow
      >
        <Wood color={item.color} />
      </RoundedBox>
      {/* Door seams and slim pulls on the front. */}
      {Array.from({ length: doors - 1 }, (_, i) => (
        <mesh
          key={`seam-${i}`}
          position={[-w / 2 + (w / doors) * (i + 1), legHeight + body / 2, depth / 2 + 0.001]}
        >
          <planeGeometry args={[0.004, body - 0.04]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.35} />
        </mesh>
      ))}
      {Array.from({ length: doors }, (_, i) => (
        <mesh
          key={`pull-${i}`}
          position={[-w / 2 + (w / doors) * (i + 0.5), legHeight + body * 0.7, depth / 2 + 0.008]}
        >
          <boxGeometry args={[0.1, 0.012, 0.012]} />
          <Metal color="#b89a5e" />
        </mesh>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`leg-${sx}-${sz}`}
            position={[sx * (w / 2 - 0.05), legHeight / 2, sz * (depth / 2 - 0.05)]}
            castShadow
          >
            <cylinderGeometry args={[0.014, 0.01, legHeight, 10]} />
            <Metal color="#2a2a2c" />
          </mesh>
        )),
      )}
      {item.variant === "tv" ? (
        // A 55-inch screen on a low foot: the size people place a carpet in front of.
        <group position={[0, height, 0]}>
          <mesh position={[0, 0.015, 0]} castShadow>
            <boxGeometry args={[0.36, 0.03, 0.2]} />
            <Metal color="#1f1f22" />
          </mesh>
          <mesh position={[0, 0.06 + 0.36, -0.02]} castShadow>
            <boxGeometry args={[1.23, 0.71, 0.035]} />
            <meshStandardMaterial color="#111114" roughness={0.25} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.06 + 0.36, -0.002]}>
            <planeGeometry args={[1.2, 0.68]} />
            <meshStandardMaterial color="#050507" roughness={0.08} metalness={0.6} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

/** A floor cushion: a round drum with a piped seam, or a soft cube. */
export function Pouf({ item }: { item: PoufItem }) {
  const { size, height } = POUF;
  const geometry = useMemo(() => {
    const r = size / 2;
    const points = [
      new Vector2(0, 0),
      new Vector2(r - 0.05, 0),
      new Vector2(r - 0.01, 0.04),
      new Vector2(r, height / 2),
      new Vector2(r - 0.01, height - 0.04),
      new Vector2(r - 0.06, height),
      new Vector2(0, height + 0.01),
    ];
    return new LatheGeometry(points, 48);
  }, [size, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  if (item.shape === "square") {
    return (
      <Padded
        size={[size, height, size]}
        at={[0, height / 2, 0]}
        color={item.color}
        radius={0.08}
      />
    );
  }
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <Fabric color={item.color} />
      </mesh>
      <mesh position={[0, height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size / 2 + 0.002, 0.008, 8, 64]} />
        <Fabric color={mixHex(item.color, "#000000", 0.2)} />
      </mesh>
    </group>
  );
}

/** Any floor piece, by kind. */
export function FloorPiece({ item, night }: { item: FloorItem; night: number }) {
  switch (item.kind) {
    case "sofa":
      return <Sofa item={item} />;
    case "table":
      return <Table item={item} />;
    case "lamp":
      return <Lamp item={item} night={night} />;
    case "plant":
      return <Plant item={item} />;
    case "cabinet":
      return <Cabinet item={item} />;
    case "pouf":
      return <Pouf item={item} />;
  }
}
