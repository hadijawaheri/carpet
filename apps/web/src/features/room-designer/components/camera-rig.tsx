"use client";

import type { RoomLayout } from "@farsh/contracts";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useRef } from "react";
import { Vector3 } from "three";

import type { RoomView } from "./room-shell";

type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;

export const ROOM_FOV = 38;
const HALF_FOV_TAN = Math.tan((ROOM_FOV / 2) * (Math.PI / 180));
/** The inside view orbits a point this far ahead of the camera, which turns the orbit into looking around. */
const LOOK_RADIUS = 0.05;

interface Pose {
  position: Vector3;
  target: Vector3;
}

export function viewPose(view: RoomView, room: RoomLayout["room"], aspect: number): Pose {
  const { width, depth } = room;
  if (view === "top") {
    const needed = Math.max(depth / 2 / HALF_FOV_TAN, width / 2 / (HALF_FOV_TAN * aspect));
    // A hair of z keeps the camera's up axis defined, so the back wall stays at the top of the screen.
    return { position: new Vector3(0, needed * 1.1 + 0.3, 0.0005), target: new Vector3(0, 0, 0) };
  }
  if (view === "inside") {
    const position = new Vector3(0, 1.5, depth / 2 - 0.45);
    return { position, target: position.clone().add(new Vector3(0, -0.004, -LOOK_RADIUS)) };
  }
  const reach = Math.max(width, depth);
  return {
    position: new Vector3(reach * 0.22, reach * 0.72 + 0.9, depth / 2 + reach * 0.95 + 0.9),
    target: new Vector3(0, 0.5, 0),
  };
}

function applyLimits(controls: OrbitControlsImpl, view: RoomView, room: RoomLayout["room"]) {
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  if (view === "top") {
    controls.enableRotate = false;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 30;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controls.rotateSpeed = 0.6;
  } else if (view === "inside") {
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = LOOK_RADIUS;
    controls.maxDistance = LOOK_RADIUS;
    controls.minPolarAngle = Math.PI * 0.32;
    controls.maxPolarAngle = Math.PI * 0.72;
    // Dragging right turns the view right, as when looking around a room, not as when turning a model.
    controls.rotateSpeed = -0.35;
  } else {
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 2.5;
    controls.maxDistance = Math.max(room.width, room.depth) * 3.4 + 2;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = 1.5;
    controls.rotateSpeed = 0.6;
  }
}

interface CameraRigProps {
  view: RoomView;
  room: RoomLayout["room"];
  reducedMotion: boolean;
  /** False while an item is being dragged or the rug is held, so the camera does not turn with it. */
  controlsEnabled: boolean;
}

/** Flies the camera between the three views, then hands it to the visitor's hands within each view's limits. */
export function CameraRig({ view, room, reducedMotion, controlsEnabled }: CameraRigProps) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const controls = useRef<OrbitControlsImpl>(null);
  const goal = useRef<Pose | null>(null);
  const enabled = useRef(controlsEnabled);
  const firstPose = useRef(true);

  useEffect(() => {
    enabled.current = controlsEnabled;
    if (controls.current && !goal.current) controls.current.enabled = controlsEnabled;
  }, [controlsEnabled]);

  useEffect(() => {
    const pose = viewPose(view, room, aspect);
    const c = controls.current;
    if (firstPose.current && c) {
      // The first frame starts in place; only later switches fly.
      firstPose.current = false;
      camera.position.copy(pose.position);
      c.target.copy(pose.target);
      applyLimits(c, view, room);
      c.update();
      return;
    }
    goal.current = pose;
    if (c) {
      // While flying, limits would clamp the move, so lift them until the camera arrives.
      c.enabled = false;
      c.minDistance = 0;
      c.maxDistance = Infinity;
      c.minPolarAngle = 0;
      c.maxPolarAngle = Math.PI;
    }
  }, [view, room, aspect, camera]);

  useFrame((_, delta) => {
    const c = controls.current;
    const g = goal.current;
    if (!c || !g) return;
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 5);
    camera.position.lerp(g.position, k);
    c.target.lerp(g.target, k);
    c.update();
    if (camera.position.distanceTo(g.position) < 0.01 && c.target.distanceTo(g.target) < 0.01) {
      camera.position.copy(g.position);
      c.target.copy(g.target);
      goal.current = null;
      applyLimits(c, view, room);
      c.enabled = enabled.current;
      c.update();
    }
  });

  return <OrbitControls ref={controls} makeDefault />;
}
