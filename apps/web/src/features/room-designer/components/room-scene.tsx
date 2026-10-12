"use client";

import {
  type Carpet,
  type FloorItem,
  isFloorItem,
  type RoomItem,
  type RoomLayout,
  type WallItem,
  type WallSide,
} from "@farsh/contracts";
import { Environment, Lightformer } from "@react-three/drei";
import { type ThreeEvent, useThree } from "@react-three/fiber";
import { Copy, Eraser, PanelRight, RotateCw, Trash2 } from "lucide-react";
import { type RefObject, useEffect, useEffectEvent, useMemo, useState } from "react";
import { type Object3D, Plane, type Ray, Raycaster, Vector2, Vector3 } from "three";

import { CarpetCloth } from "@/features/carpet-viewer";

import { paintingDimensions, WINDOW } from "../data/catalog";
import {
  type AspectOf,
  clampAlong,
  clampToRoom,
  floorFootprint,
  floorHeight,
  type Footprint,
  rugSize,
  snapSofaToWall,
  wallFrame,
} from "../state/room-geometry";
import { aspectLookup, duplicateItem, type RoomAction } from "../state/room-reducer";
import { lightPresets } from "../three/light-presets";
import { contactShadow } from "../three/textures";
import { CameraRig } from "./camera-rig";
import { FloorPiece } from "./furniture";
import {
  ItemToolbar,
  Measurements,
  Outline,
  OVERLAY,
  RotateHandle,
  type ToolbarAction,
  WallOutline,
} from "./room-overlays";
import { RoomShell, type RoomView } from "./room-shell";
import { Curtain, Painting } from "./wall-items";

export type RoomTool = "arrange" | "touch";

/** Id the rug uses in the selection, since it is not one of the layout's items. */
export const RUG_ID = "rug";

const FLOOR_PLANE = new Plane(new Vector3(0, 1, 0), 0);
/** The cloth lifts itself by its pile; this only keeps its underside off the boards' pixels. */
const RUG_HEIGHT = 0.002;
const WALL_SIDES: WallSide[] = ["back", "right", "front", "left"];
/** Turning settles on the nearest 15° within about 2°, so square placements are easy but any angle is possible. */
const SNAP_STEP = Math.PI / 12;
const SNAP_WITHIN = 0.035;

type Drag =
  | { kind: "floor"; id: string; dx: number; dz: number }
  | { kind: "rotate"; id: string; offset: number }
  | { kind: "wall"; id: string; da: number; dy: number };

type ActiveDrag = Drag & { pointerId: number; group: string };

/**
 * Stops the camera at once when a drag starts. Its controls hear the press first, and waiting for the
 * next render to disable them lets the first moves of a drag turn the room as well.
 */
function pauseControls(controls: unknown) {
  if (controls && typeof controls === "object" && "enabled" in controls) {
    (controls as { enabled: boolean }).enabled = false;
  }
}

function normalizeAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function softSnap(angle: number) {
  const a = normalizeAngle(angle);
  const nearest = Math.round(a / SNAP_STEP) * SNAP_STEP;
  return Math.abs(a - nearest) < SNAP_WITHIN ? nearest : a;
}

const scratchPlane = new Plane();
const scratchNormal = new Vector3();
const scratchPoint = new Vector3();

function wallPlane(wall: WallSide, room: RoomLayout["room"]) {
  const frame = wallFrame(wall, room);
  return scratchPlane.setFromNormalAndCoplanarPoint(
    scratchNormal.set(frame.normal.x, 0, frame.normal.z),
    scratchPoint.set(frame.x, 0, frame.z),
  );
}

function alongWall(wall: WallSide, room: RoomLayout["room"], point: Vector3) {
  const frame = wallFrame(wall, room);
  return (point.x - frame.x) * frame.tangent.x + (point.z - frame.z) * frame.tangent.z;
}

/**
 * The wall a ray points at, among those the camera stands in front of (the others are hidden):
 * the nearest hit inside a wall's bounds, so a painting follows the pointer round a corner.
 */
function wallUnderRay(ray: Ray, room: RoomLayout["room"], out: Vector3) {
  let best: { wall: WallSide; along: number; y: number } | null = null;
  let bestDistance = Infinity;
  for (const wall of WALL_SIDES) {
    const frame = wallFrame(wall, room);
    const side =
      (ray.origin.x - frame.x) * frame.normal.x + (ray.origin.z - frame.z) * frame.normal.z;
    if (side <= 0) continue;
    if (!ray.intersectPlane(wallPlane(wall, room), out)) continue;
    const along = alongWall(wall, room, out);
    if (Math.abs(along) > frame.length / 2 + 0.2 || out.y < -0.2 || out.y > room.height + 0.6) {
      continue;
    }
    const distance = out.distanceTo(ray.origin);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { wall, along, y: out.y };
    }
  }
  return best;
}

function wallItemSize(item: WallItem, roomHeight: number, aspectOf: AspectOf) {
  if (item.kind === "painting") return paintingDimensions(item, aspectOf(item.carpet));
  return {
    width: item.width + 2 * WINDOW.rodOverhang,
    height: Math.min(roomHeight - 0.1, WINDOW.sill + WINDOW.height + 0.5),
  };
}

function Lights({ layout }: { layout: RoomLayout }) {
  const { room } = layout;
  const preset = lightPresets[layout.light];
  const reach = Math.max(room.width, room.depth);
  // Sunlight comes through the first window; with none, from the right and front.
  const window = layout.items.find((i) => i.kind === "curtain");
  const sun = useMemo(() => {
    if (!window || window.kind !== "curtain") return new Vector3(4, preset.sunHeight, 5);
    const frame = wallFrame(window.wall, room);
    const along = window.along;
    return new Vector3(
      frame.x + frame.tangent.x * along - frame.normal.x * 5,
      preset.sunHeight,
      frame.z + frame.tangent.z * along - frame.normal.z * 5,
    );
  }, [window, room, preset.sunHeight]);

  return (
    <>
      <hemisphereLight args={[preset.sky, preset.ground, preset.hemisphere]} />
      <directionalLight
        position={sun.toArray()}
        intensity={preset.sunIntensity}
        color={preset.sun}
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
      {/* Recessed ceiling lights after dark: without them a room with no lamp lit would read as black. */}
      {preset.night > 0 ? (
        <pointLight
          position={[0, room.height - 0.3, 0]}
          color="#ffd9a8"
          intensity={preset.night * 4.5}
          distance={14}
          decay={1.3}
        />
      ) : null}
      <Environment resolution={128} environmentIntensity={preset.environment}>
        <Lightformer
          form="rect"
          intensity={1.6}
          color={preset.sun}
          position={[0, 5, 2]}
          scale={[8, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color={preset.sky}
          position={[-5, 2, 2]}
          scale={[3, 4, 1]}
        />
      </Environment>
    </>
  );
}

/** A soft dark patch under a piece, where the shadow map is too coarse to show it touching the floor. */
function Grounding({ footprint }: { footprint: Footprint }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      // Above the rug's pile, so a table standing on the rug is grounded too.
      position={[0, 0.02, footprint.offsetZ ?? 0]}
      renderOrder={2}
    >
      <planeGeometry args={[footprint.width * 1.2 + 0.12, footprint.depth * 1.2 + 0.12]} />
      <meshBasicMaterial map={contactShadow()} transparent opacity={0.55} depthWrite={false} />
    </mesh>
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
    captureRef.current = () =>
      new Promise((resolve) => {
        // Selection marks and handles guide the visitor; they do not belong in the picture.
        const hidden: Object3D[] = [];
        scene.traverse((object) => {
          if (object.userData.overlay && object.visible) {
            object.visible = false;
            hidden.push(object);
          }
        });
        const ratio = gl.getPixelRatio();
        gl.setPixelRatio(Math.max(2, ratio));
        // Render, then copy the canvas in the same task: the drawing buffer is cleared once the frame is presented.
        gl.render(scene, camera);
        gl.domElement.toBlob((blob) => resolve(blob), "image/png");
        gl.setPixelRatio(ratio);
        for (const object of hidden) object.visible = true;
      });
    return () => {
      captureRef.current = null;
    };
  }, [captureRef, gl, scene, camera]);
  return null;
}

interface RoomSceneProps {
  layout: RoomLayout;
  carpet: Carpet;
  /** Every carpet photo, for tableaux hung on the walls. */
  carpets: Carpet[];
  selectedId: string | null;
  tool: RoomTool;
  view: RoomView;
  reducedMotion: boolean;
  paintingImages: Record<string, string>;
  shakeRef: RefObject<(() => void) | null>;
  flattenRef: RefObject<(() => void) | null>;
  captureRef: RefObject<(() => Promise<Blob | null>) | null>;
  dispatch: (action: RoomAction) => void;
  onSelect: (id: string | null) => void;
}

export function RoomScene({
  layout,
  carpet,
  carpets,
  selectedId,
  tool,
  view,
  reducedMotion,
  paintingImages,
  shakeRef,
  flattenRef,
  captureRef,
  dispatch,
  onSelect,
}: RoomSceneProps) {
  const { room, rug } = layout;
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const controls = useThree((s) => s.controls);
  const [drag, setDrag] = useState<ActiveDrag | null>(null);
  const [holdingRug, setHoldingRug] = useState(false);
  const raycaster = useMemo(() => new Raycaster(), []);
  const pointer = useMemo(() => new Vector2(), []);
  const hit = useMemo(() => new Vector3(), []);
  const arrange = tool === "arrange";
  const size = rugSize(rug, carpet);
  const rugFootprint: Footprint = { width: size.width, depth: size.length };
  const aspectOf = aspectLookup(carpets);
  const preset = lightPresets[layout.light];

  const itemById = (id: string) => layout.items.find((item) => item.id === id);

  const start = (event: ThreeEvent<PointerEvent>, next: Drag) => {
    event.stopPropagation();
    pauseControls(controls);
    // The press's timestamp names the drag, so all its moves undo as one step.
    setDrag({ ...next, pointerId: event.pointerId, group: `drag-${event.nativeEvent.timeStamp}` });
  };

  const grabFloor = (id: string, event: ThreeEvent<PointerEvent>) => {
    if (!arrange) return;
    onSelect(id);
    const at = id === RUG_ID ? rug : itemById(id);
    if (!at || !("x" in at) || !event.ray.intersectPlane(FLOOR_PLANE, hit)) return;
    start(event, { kind: "floor", id, dx: at.x - hit.x, dz: at.z - hit.z });
  };

  const grabRotate = (id: string, event: ThreeEvent<PointerEvent>) => {
    const at = id === RUG_ID ? rug : itemById(id);
    if (!at || !("x" in at) || !event.ray.intersectPlane(FLOOR_PLANE, hit)) return;
    const angle = Math.atan2(hit.x - at.x, hit.z - at.z);
    start(event, { kind: "rotate", id, offset: at.rotation - angle });
  };

  const grabWall = (item: WallItem, event: ThreeEvent<PointerEvent>) => {
    if (!arrange || view === "top") return;
    onSelect(item.id);
    if (!event.ray.intersectPlane(wallPlane(item.wall, room), hit)) return;
    const along = alongWall(item.wall, room, hit);
    start(event, {
      kind: "wall",
      id: item.id,
      da: item.along - along,
      dy: item.kind === "painting" ? item.y - hit.y : 0,
    });
  };

  const moveRug = (d: ActiveDrag, ray: Ray) => {
    if (!ray.intersectPlane(FLOOR_PLANE, hit)) return;
    if (d.kind === "floor") {
      const spot = clampToRoom(room, hit.x + d.dx, hit.z + d.dz, rugFootprint, rug.rotation);
      dispatch({ type: "rug", patch: spot, group: d.group });
    } else if (d.kind === "rotate") {
      const rotation = softSnap(Math.atan2(hit.x - rug.x, hit.z - rug.z) + d.offset);
      const spot = clampToRoom(room, rug.x, rug.z, rugFootprint, rotation);
      dispatch({ type: "rug", patch: { ...spot, rotation }, group: d.group });
    }
  };

  const moveFloorItem = (d: ActiveDrag, item: FloorItem, ray: Ray) => {
    if (!ray.intersectPlane(FLOOR_PLANE, hit)) return;
    const footprint = floorFootprint(item);
    if (d.kind === "rotate") {
      const rotation = softSnap(Math.atan2(hit.x - item.x, hit.z - item.z) + d.offset);
      const spot = clampToRoom(room, item.x, item.z, footprint, rotation);
      dispatch({ type: "replace", item: { ...item, ...spot, rotation }, group: d.group });
      return;
    }
    if (d.kind !== "floor") return;
    const x = hit.x + d.dx;
    const z = hit.z + d.dz;
    const spot =
      item.kind === "sofa"
        ? snapSofaToWall(room, x, z, item.rotation, footprint)
        : { ...clampToRoom(room, x, z, footprint, item.rotation), rotation: item.rotation };
    dispatch({ type: "replace", item: { ...item, ...spot }, group: d.group });
  };

  const moveWallItem = (d: ActiveDrag, item: WallItem, ray: Ray) => {
    if (d.kind !== "wall") return;
    const target = wallUnderRay(ray, room, hit);
    if (!target) return;
    const along = clampAlong(room, item, target.wall, target.along + d.da, aspectOf);
    if (item.kind === "curtain") {
      dispatch({ type: "replace", item: { ...item, wall: target.wall, along }, group: d.group });
      return;
    }
    const half = paintingDimensions(item, aspectOf(item.carpet)).height / 2;
    const y = Math.min(room.height - half - 0.08, Math.max(half + 0.15, target.y + d.dy));
    dispatch({ type: "replace", item: { ...item, wall: target.wall, along, y }, group: d.group });
  };

  const onDragMove = useEffectEvent((d: ActiveDrag, ray: Ray) => {
    if (d.id === RUG_ID) {
      moveRug(d, ray);
      return;
    }
    const item = itemById(d.id);
    if (!item) return;
    if (isFloorItem(item)) moveFloorItem(d, item, ray);
    else moveWallItem(d, item, ray);
  });

  // Moves are followed on the window, not on the mesh: a painting carried to another wall is
  // re-created under that wall, and a mesh that is re-created loses the pointer.
  useEffect(() => {
    if (!drag) return;
    const element = gl.domElement;
    const move = (event: PointerEvent) => {
      if (event.pointerId !== drag.pointerId) return;
      const rect = element.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      onDragMove(drag, raycaster.ray);
    };
    const end = (event: PointerEvent) => {
      if (event.pointerId !== drag.pointerId) return;
      document.body.style.cursor = "";
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [drag, gl, camera, pointer, raycaster]);

  const hover = {
    // The wall or floor behind would otherwise take the click and clear the selection.
    onClick: (event: ThreeEvent<MouseEvent>) => event.stopPropagation(),
    onPointerOver: () => {
      if (arrange) document.body.style.cursor = "move";
    },
    onPointerOut: () => {
      if (!drag) document.body.style.cursor = "";
    },
  };

  const turnBy = (item: FloorItem, angle: number) => {
    const rotation = normalizeAngle(item.rotation + angle);
    dispatch({
      type: "replace",
      item: {
        ...item,
        rotation,
        ...clampToRoom(room, item.x, item.z, floorFootprint(item), rotation),
      },
    });
  };

  const copy = (item: RoomItem) => {
    const twin = duplicateItem(item, layout);
    dispatch({ type: "add", item: twin });
    onSelect(twin.id);
  };

  const remove = (item: RoomItem) => {
    dispatch({ type: "remove", id: item.id });
    onSelect(null);
  };

  const common = (item: RoomItem): ToolbarAction[] => [
    { label: "تکثیر", icon: Copy, onSelect: () => copy(item) },
    { label: "حذف", icon: Trash2, onSelect: () => remove(item) },
  ];

  const toolbar = () => {
    if (!arrange || drag || !selectedId) return null;
    if (selectedId === RUG_ID) {
      return (
        <ItemToolbar
          // Past the turning knob in front of the rug, so the bar never covers the table on it.
          position={[
            Math.max(
              -room.width / 2,
              Math.min(room.width / 2, rug.x + Math.sin(rug.rotation) * (size.length / 2 + 0.7)),
            ),
            0.25,
            Math.max(
              -room.depth / 2,
              Math.min(room.depth / 2, rug.z + Math.cos(rug.rotation) * (size.length / 2 + 0.7)),
            ),
          ]}
          actions={[
            {
              label: "چرخاندن ۹۰ درجه",
              icon: RotateCw,
              onSelect: () =>
                dispatch({
                  type: "rug",
                  patch: { rotation: normalizeAngle(rug.rotation + Math.PI / 2) },
                }),
            },
            { label: "صاف کردن فرش", icon: Eraser, onSelect: () => flattenRef.current?.() },
          ]}
        />
      );
    }
    const item = itemById(selectedId);
    if (!item) return null;
    if (isFloorItem(item)) {
      return (
        <ItemToolbar
          position={[item.x, floorHeight(item) + 0.28, item.z]}
          actions={[
            { label: "چرخاندن ۴۵ درجه", icon: RotateCw, onSelect: () => turnBy(item, Math.PI / 4) },
            ...common(item),
          ]}
        />
      );
    }
    if (view === "top") return null;
    const frame = wallFrame(item.wall, room);
    const { height } = wallItemSize(item, room.height, aspectOf);
    const top = item.kind === "painting" ? item.y + height / 2 : height;
    const next = WALL_SIDES[(WALL_SIDES.indexOf(item.wall) + 1) % WALL_SIDES.length] ?? "back";
    return (
      <ItemToolbar
        position={[
          frame.x + frame.tangent.x * item.along + frame.normal.x * 0.15,
          Math.min(room.height - 0.1, top + 0.2),
          frame.z + frame.tangent.z * item.along + frame.normal.z * 0.15,
        ]}
        actions={[
          {
            label: "بردن به دیوار بعدی",
            icon: PanelRight,
            directional: true,
            onSelect: () =>
              dispatch({
                type: "replace",
                item: { ...item, wall: next, along: clampAlong(room, item, next, 0, aspectOf) },
              }),
          },
          ...common(item),
        ]}
      />
    );
  };

  const wallItems = (wall: WallSide) =>
    layout.items.map((item) => {
      if (isFloorItem(item) || item.wall !== wall) return null;
      const selected = selectedId === item.id;
      const size = wallItemSize(item, room.height, aspectOf);
      return (
        <group
          key={item.id}
          position={[
            item.along,
            item.kind === "painting" ? item.y : 0,
            item.kind === "painting" ? 0.002 : 0,
          ]}
          onPointerDown={(event) => grabWall(item, event)}
          {...hover}
        >
          {item.kind === "painting" ? (
            <Painting
              item={item}
              imageUrl={paintingImages[item.id]}
              carpet={
                item.art === "carpet" ? carpets.find((c) => c.slug === item.carpet) : undefined
              }
            />
          ) : (
            <Curtain item={item} roomHeight={room.height} glass={preset.glass} />
          )}
          {selected && item.kind === "painting" ? <WallOutline {...size} /> : null}
          {selected && item.kind === "curtain" ? (
            <group position={[0, size.height / 2, 0.05]}>
              <WallOutline {...size} />
            </group>
          ) : null}
        </group>
      );
    });

  const selectedFloor = layout.items.find(
    (item): item is FloorItem => item.id === selectedId && isFloorItem(item),
  );

  return (
    <>
      <color attach="background" args={["#1d0a0c"]} />
      <Lights layout={layout} />
      <CameraRig
        view={view}
        room={room}
        reducedMotion={reducedMotion}
        controlsEnabled={!drag && !holdingRug}
      />
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

      {/* In "touch" mode a grab lifts and folds the rug; in "arrange" mode it moves and turns like furniture. */}
      <group
        position={[rug.x, RUG_HEIGHT, rug.z]}
        rotation={[0, rug.rotation, 0]}
        onPointerDown={(event) => grabFloor(RUG_ID, event)}
        {...hover}
      >
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <CarpetCloth
            carpet={carpet}
            material={rug.material}
            reducedMotion={reducedMotion}
            lying
            heightUnits={size.length}
            interactive={!arrange}
            onGrab={() => {
              pauseControls(controls);
              setHoldingRug(true);
            }}
            onGrabEnd={() => setHoldingRug(false)}
            shakeRef={shakeRef}
            flattenRef={flattenRef}
          />
        </group>
        {selectedId === RUG_ID && arrange ? (
          <group userData={OVERLAY}>
            <Outline footprint={rugFootprint} />
            <RotateHandle
              footprint={rugFootprint}
              compact
              onGrab={(event) => grabRotate(RUG_ID, event)}
            />
          </group>
        ) : null}
      </group>

      {layout.items.filter(isFloorItem).map((item) => {
        const footprint = floorFootprint(item);
        const selected = selectedId === item.id && arrange;
        return (
          <group
            key={item.id}
            position={[item.x, 0, item.z]}
            rotation={[0, item.rotation, 0]}
            onPointerDown={(event) => grabFloor(item.id, event)}
            {...hover}
          >
            <FloorPiece item={item} night={preset.night} />
            <Grounding footprint={footprint} />
            {selected ? (
              <group userData={OVERLAY}>
                <Outline footprint={footprint} />
                <RotateHandle
                  footprint={footprint}
                  onGrab={(event) => grabRotate(item.id, event)}
                />
              </group>
            ) : null}
          </group>
        );
      })}

      {arrange && selectedId === RUG_ID ? (
        <Measurements
          room={room}
          x={rug.x}
          z={rug.z}
          footprint={rugFootprint}
          rotation={rug.rotation}
        />
      ) : null}
      {arrange && selectedFloor ? (
        <Measurements
          room={room}
          x={selectedFloor.x}
          z={selectedFloor.z}
          footprint={floorFootprint(selectedFloor)}
          rotation={selectedFloor.rotation}
        />
      ) : null}
      {toolbar()}
    </>
  );
}
