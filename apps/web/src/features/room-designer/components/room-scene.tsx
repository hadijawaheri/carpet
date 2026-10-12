"use client";

import type { Carpet, RoomItem, RoomLayout, WallSide } from "@farsh/contracts";
import { Environment, Lightformer, Line } from "@react-three/drei";
import { type ThreeEvent, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useState } from "react";
import { Plane, Vector3 } from "three";

import { CarpetCloth } from "@/features/carpet-viewer";

import { paintingDimensions, WINDOW } from "../data/catalog";
import {
  clampAlong,
  clampToRoom,
  floorFootprint,
  rugSize,
  snapSofaToWall,
  wallFrame,
} from "../state/room-geometry";
import type { RoomAction } from "../state/room-reducer";
import { CameraRig } from "./camera-rig";
import { Sofa, Table } from "./furniture";
import { RoomShell, type RoomView } from "./room-shell";
import { Curtain, Painting } from "./wall-items";

export type RoomTool = "arrange" | "touch";

/** Id the rug uses in the selection, since it is not one of the layout's items. */
export const RUG_ID = "rug";

const SELECTION = "#f6c453";
const FLOOR_PLANE = new Plane(new Vector3(0, 1, 0), 0);
/** The rug lies a hair above the boards so the two never fight for the same pixel. */
const RUG_HEIGHT = 0.012;

interface Drag {
  id: string;
  /** Floor drags keep the grab offset in x/z; wall drags keep it along the wall and in height. */
  floor: boolean;
  wall?: WallSide;
  offsetA: number;
  offsetB: number;
}

/** The drag in progress. A plain object from useMemo, not a ref: the React Compiler forbids reading refs while building handlers. */
class DragSession {
  drag: Drag | null = null;
  begin(drag: Drag) {
    this.drag = drag;
  }
  end() {
    this.drag = null;
  }
}

interface RoomSceneProps {
  layout: RoomLayout;
  carpet: Carpet;
  selectedId: string | null;
  tool: RoomTool;
  view: RoomView;
  reducedMotion: boolean;
  paintingImages: Record<string, string>;
  shakeRef: RefObject<(() => void) | null>;
  captureRef: RefObject<(() => Promise<Blob | null>) | null>;
  dispatch: (action: RoomAction) => void;
  onSelect: (id: string | null) => void;
}

function Lights({ layout }: { layout: RoomLayout }) {
  const { room } = layout;
  const reach = Math.max(room.width, room.depth);
  // Sunlight comes through the first window; with none, from the right and front.
  const window = layout.items.find((i) => i.kind === "curtain");
  const sun = useMemo(() => {
    if (!window || window.kind !== "curtain") return new Vector3(4, 6, 5);
    const frame = wallFrame(window.wall, room);
    return new Vector3(frame.x - frame.normal.x * 5, 6, frame.z - frame.normal.z * 5);
  }, [window, room]);

  return (
    <>
      <hemisphereLight args={["#ffffff", "#efe6d6", 2.1]} />
      <directionalLight
        position={sun.toArray()}
        intensity={1.9}
        color="#fff7ec"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={5}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-reach * 0.85, reach * 0.85, reach * 0.85, -reach * 0.85, 0.5, 30]}
        />
      </directionalLight>
      <Environment resolution={128} environmentIntensity={0.5}>
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#fff4e2"
          position={[0, 5, 2]}
          scale={[8, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#e8f0ff"
          position={[-5, 2, 2]}
          scale={[3, 4, 1]}
        />
      </Environment>
    </>
  );
}

/** A saffron outline on the floor (or on the wall) around the selected item. */
function Outline({ width, depth, y = 0.03 }: { width: number; depth: number; y?: number }) {
  const hw = width / 2 + 0.04;
  const hd = depth / 2 + 0.04;
  const points: [number, number, number][] = [
    [-hw, y, -hd],
    [hw, y, -hd],
    [hw, y, hd],
    [-hw, y, hd],
    [-hw, y, -hd],
  ];
  return (
    <Line points={points} color={SELECTION} lineWidth={3} depthTest={false} renderOrder={20} />
  );
}

function WallOutline({ width, height }: { width: number; height: number }) {
  const hw = width / 2 + 0.04;
  const hh = height / 2 + 0.04;
  const points: [number, number, number][] = [
    [-hw, -hh, 0.07],
    [hw, -hh, 0.07],
    [hw, hh, 0.07],
    [-hw, hh, 0.07],
    [-hw, -hh, 0.07],
  ];
  return (
    <Line points={points} color={SELECTION} lineWidth={3} depthTest={false} renderOrder={20} />
  );
}

function CaptureBridge({
  captureRef,
}: {
  captureRef: RefObject<(() => Promise<Blob | null>) | null>;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    // Render, then read the canvas in the same task: the drawing buffer is cleared once the frame is presented.
    captureRef.current = () =>
      new Promise((resolve) => {
        gl.render(scene, camera);
        gl.domElement.toBlob((blob) => resolve(blob), "image/png");
      });
    return () => {
      captureRef.current = null;
    };
  }, [captureRef, gl, scene, camera]);
  return null;
}

export function RoomScene({
  layout,
  carpet,
  selectedId,
  tool,
  view,
  reducedMotion,
  paintingImages,
  shakeRef,
  captureRef,
  dispatch,
  onSelect,
}: RoomSceneProps) {
  const { room, rug } = layout;
  const [busy, setBusy] = useState(false);
  const session = useMemo(() => new DragSession(), []);
  const hit = useMemo(() => new Vector3(), []);
  const arrange = tool === "arrange";
  const size = rugSize(rug, carpet);

  const itemById = (id: string) => layout.items.find((item) => item.id === id);

  const beginDrag = (id: string, event: ThreeEvent<PointerEvent>) => {
    if (!arrange) return;
    event.stopPropagation();
    onSelect(id);
    const item = id === RUG_ID ? undefined : itemById(id);
    const wallItem = item?.kind === "painting" || item?.kind === "curtain" ? item : undefined;
    if (wallItem) {
      const frame = wallFrame(wallItem.wall, room);
      const plane = new Plane().setFromNormalAndCoplanarPoint(
        new Vector3(frame.normal.x, 0, frame.normal.z),
        new Vector3(frame.x, 0, frame.z),
      );
      if (!event.ray.intersectPlane(plane, hit)) return;
      const along = (hit.x - frame.x) * frame.tangent.x + (hit.z - frame.z) * frame.tangent.z;
      session.begin({
        id,
        floor: false,
        wall: wallItem.wall,
        offsetA: wallItem.along - along,
        offsetB: wallItem.kind === "painting" ? wallItem.y - hit.y : 0,
      });
    } else {
      if (!event.ray.intersectPlane(FLOOR_PLANE, hit)) return;
      const at = item && (item.kind === "sofa" || item.kind === "table") ? item : rug;
      session.begin({ id, floor: true, offsetA: at.x - hit.x, offsetB: at.z - hit.z });
    }
    (event.target as unknown as Element).setPointerCapture(event.pointerId);
    setBusy(true);
  };

  const moveDrag = (event: ThreeEvent<PointerEvent>) => {
    const d = session.drag;
    if (!d) return;
    if (d.floor) {
      if (!event.ray.intersectPlane(FLOOR_PLANE, hit)) return;
      const x = hit.x + d.offsetA;
      const z = hit.z + d.offsetB;
      if (d.id === RUG_ID) {
        const spot = clampToRoom(
          room,
          x,
          z,
          { width: size.width, depth: size.length },
          rug.rotation,
        );
        dispatch({ type: "rug", patch: spot });
        return;
      }
      const item = itemById(d.id);
      if (item?.kind === "sofa") {
        const snapped = snapSofaToWall(room, x, z, item.rotation, floorFootprint(item));
        dispatch({ type: "replace", item: { ...item, ...snapped } });
      } else if (item?.kind === "table") {
        dispatch({
          type: "replace",
          item: { ...item, ...clampToRoom(room, x, z, floorFootprint(item), item.rotation) },
        });
      }
      return;
    }
    const item = itemById(d.id);
    if (!item || !d.wall || (item.kind !== "painting" && item.kind !== "curtain")) return;
    const frame = wallFrame(d.wall, room);
    const plane = new Plane().setFromNormalAndCoplanarPoint(
      new Vector3(frame.normal.x, 0, frame.normal.z),
      new Vector3(frame.x, 0, frame.z),
    );
    if (!event.ray.intersectPlane(plane, hit)) return;
    const along =
      (hit.x - frame.x) * frame.tangent.x + (hit.z - frame.z) * frame.tangent.z + d.offsetA;
    const next = { ...item, along: clampAlong(room, item, d.wall, along) };
    if (next.kind === "painting") {
      const half = paintingDimensions(next).height / 2;
      dispatch({
        type: "replace",
        item: {
          ...next,
          y: Math.min(room.height - half - 0.1, Math.max(half + 0.3, hit.y + d.offsetB)),
        },
      });
    } else {
      dispatch({ type: "replace", item: next });
    }
  };

  const endDrag = (event: ThreeEvent<PointerEvent>) => {
    if (!session.drag) return;
    session.end();
    (event.target as unknown as Element).releasePointerCapture(event.pointerId);
    setBusy(false);
  };

  const handlers = (id: string) => ({
    onPointerDown: (event: ThreeEvent<PointerEvent>) => beginDrag(id, event),
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onPointerOver: () => {
      if (arrange) document.body.style.cursor = "move";
    },
    onPointerOut: () => {
      if (!session.drag) document.body.style.cursor = "";
    },
  });

  const wallItems = (wall: WallSide) =>
    layout.items.map((item) => {
      if ((item.kind !== "painting" && item.kind !== "curtain") || item.wall !== wall) return null;
      const selected = selectedId === item.id;
      return (
        <group
          key={item.id}
          position={[
            item.along,
            item.kind === "painting" ? item.y : 0,
            item.kind === "painting" ? 0.02 : 0,
          ]}
          {...handlers(item.id)}
        >
          {item.kind === "painting" ? (
            <Painting item={item} imageUrl={paintingImages[item.id]} />
          ) : (
            <Curtain item={item} roomHeight={room.height} />
          )}
          {selected && item.kind === "painting" ? (
            <WallOutline {...paintingDimensions(item)} />
          ) : null}
          {selected && item.kind === "curtain" ? (
            <group position={[0, WINDOW.sill + WINDOW.height / 2, 0]}>
              <WallOutline
                width={item.width + 2 * WINDOW.rodOverhang}
                height={WINDOW.height + 0.5}
              />
            </group>
          ) : null}
        </group>
      );
    });

  const floorItems = layout.items.filter(
    (item): item is Extract<RoomItem, { kind: "sofa" | "table" }> =>
      item.kind === "sofa" || item.kind === "table",
  );

  return (
    <>
      <color attach="background" args={["#1d0a0c"]} />
      <Lights layout={layout} />
      <CameraRig view={view} room={room} reducedMotion={reducedMotion} controlsEnabled={!busy} />
      <CaptureBridge captureRef={captureRef} />
      <RoomShell
        layout={layout}
        view={view}
        reducedMotion={reducedMotion}
        onBackgroundClick={() => onSelect(null)}
        wallItems={{
          back: wallItems("back"),
          left: wallItems("left"),
          right: wallItems("right"),
          front: wallItems("front"),
        }}
      />

      {/* The rug lies on the floor. In "touch" mode a grab lifts its corner; in "arrange" mode it is moved like furniture. */}
      <group
        position={[rug.x, RUG_HEIGHT, rug.z]}
        rotation={[0, rug.rotation, 0]}
        {...handlers(RUG_ID)}
      >
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <CarpetCloth
            carpet={carpet}
            material={rug.material}
            reducedMotion={reducedMotion}
            lying
            heightUnits={size.length}
            interactive={!arrange}
            onGrab={() => setBusy(true)}
            onGrabEnd={() => setBusy(false)}
            shakeRef={shakeRef}
          />
        </group>
        {selectedId === RUG_ID ? <Outline width={size.width} depth={size.length} /> : null}
      </group>

      {floorItems.map((item) => (
        <group
          key={item.id}
          position={[item.x, 0, item.z]}
          rotation={[0, item.rotation, 0]}
          {...handlers(item.id)}
        >
          {item.kind === "sofa" ? <Sofa item={item} /> : <Table item={item} />}
          {selectedId === item.id ? <Outline {...floorFootprint(item)} /> : null}
        </group>
      ))}
    </>
  );
}
