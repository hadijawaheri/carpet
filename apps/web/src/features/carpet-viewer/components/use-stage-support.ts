"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { webglSupport } from "../webgl-support";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const mql = window.matchMedia(reducedMotionQuery);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

/** What a 3D stage needs to know about the device, and whether its box is on screen. */
export function useStageSupport() {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  const webgl = useSyncExternalStore(
    () => () => {},
    () => webglSupport().version > 0,
    () => false,
  );
  const software = useSyncExternalStore(
    () => () => {},
    () => webglSupport().software,
    () => false,
  );
  // An off-screen carpet stops simulating, so the room preview below gets the whole GPU.
  const box = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry?.isIntersecting ?? true),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { reducedMotion, webgl, software, box, onScreen };
}
