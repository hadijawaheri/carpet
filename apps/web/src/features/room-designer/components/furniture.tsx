"use client";

import type { SofaItem, TableItem } from "@farsh/contracts";
import { RoundedBox } from "@react-three/drei";

import { SOFA, tableDimensions } from "../data/catalog";
import { cushionColor } from "../state/room-reducer";

const LEG = "#2b1f19";

/** A sofa of simple rounded blocks at real scale. Its front faces +z; one seat makes an armchair. */
export function Sofa({ item }: { item: SofaItem }) {
  const { seatWidth, arm, depth, legHeight, seatTop, backTop } = SOFA;
  const width = item.seats * seatWidth + 2 * arm;
  const baseHeight = 0.26;
  const baseTop = legHeight + baseHeight;
  const cushion = cushionColor(item.color);
  const backHeight = backTop - baseTop;
  const seats = Array.from(
    { length: item.seats },
    (_, i) => -((item.seats - 1) * seatWidth) / 2 + i * seatWidth,
  );

  return (
    <group>
      <RoundedBox
        args={[width, baseHeight, depth]}
        radius={0.04}
        smoothness={3}
        position={[0, legHeight + baseHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={item.color} roughness={0.92} />
      </RoundedBox>
      {seats.map((x) => (
        <RoundedBox
          key={`seat-${x}`}
          args={[seatWidth - 0.02, seatTop - baseTop, depth - 0.3]}
          radius={0.05}
          smoothness={4}
          position={[x, baseTop + (seatTop - baseTop) / 2, 0.08]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={cushion} roughness={0.95} />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[width - 2 * arm + 0.04, backHeight, 0.2]}
        radius={0.05}
        smoothness={3}
        position={[0, baseTop + backHeight / 2, -depth / 2 + 0.1]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={item.color} roughness={0.92} />
      </RoundedBox>
      {seats.map((x) => (
        <RoundedBox
          key={`back-${x}`}
          args={[seatWidth - 0.04, backHeight - 0.08, 0.14]}
          radius={0.05}
          smoothness={4}
          position={[x, seatTop + (backHeight - 0.08) / 2 - 0.02, -depth / 2 + 0.27]}
          rotation={[-0.16, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={cushion} roughness={0.95} />
        </RoundedBox>
      ))}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={`arm-${side}`}
          args={[arm, 0.62 - legHeight, depth]}
          radius={0.05}
          smoothness={3}
          position={[side * (width / 2 - arm / 2), legHeight + (0.62 - legHeight) / 2, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={item.color} roughness={0.92} />
        </RoundedBox>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`leg-${sx}-${sz}`}
            position={[sx * (width / 2 - 0.08), legHeight / 2, sz * (depth / 2 - 0.08)]}
            castShadow
          >
            <cylinderGeometry args={[0.022, 0.016, legHeight, 12]} />
            <meshStandardMaterial color={LEG} roughness={0.5} />
          </mesh>
        )),
      )}
    </group>
  );
}

const TOP = 0.04;

/** A round or rectangular table, coffee or dining height. */
export function Table({ item }: { item: TableItem }) {
  const { width, depth, height } = tableDimensions(item);
  const legHeight = height - TOP;

  return (
    <group>
      {item.shape === "round" ? (
        <>
          <mesh position={[0, height - TOP / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[width / 2, width / 2, TOP, 56]} />
            <meshStandardMaterial color={item.color} roughness={0.5} />
          </mesh>
          <mesh position={[0, legHeight / 2, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.06, legHeight, 24]} />
            <meshStandardMaterial color={item.color} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[width * 0.28, width * 0.3, 0.03, 40]} />
            <meshStandardMaterial color={item.color} roughness={0.5} />
          </mesh>
        </>
      ) : (
        <>
          <RoundedBox
            args={[width, TOP, depth]}
            radius={0.012}
            smoothness={3}
            position={[0, height - TOP / 2, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={item.color} roughness={0.5} />
          </RoundedBox>
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sz) => (
              <mesh
                key={`leg-${sx}-${sz}`}
                position={[sx * (width / 2 - 0.06), legHeight / 2, sz * (depth / 2 - 0.06)]}
                castShadow
              >
                <boxGeometry args={[0.05, legHeight, 0.05]} />
                <meshStandardMaterial color={item.color} roughness={0.5} />
              </mesh>
            )),
          )}
        </>
      )}
    </group>
  );
}
