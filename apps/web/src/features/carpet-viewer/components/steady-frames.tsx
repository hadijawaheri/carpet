"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

/** A capped frame rate for software rendering: input events get the processor between frames. */
export function SteadyFrames({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const timer = window.setInterval(() => invalidate(), 1000 / fps);
    return () => window.clearInterval(timer);
  }, [fps, invalidate]);
  return null;
}
