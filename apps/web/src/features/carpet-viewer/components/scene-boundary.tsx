"use client";

import { Component, type ReactNode } from "react";

interface SceneBoundaryProps {
  /** Shown instead of the canvas when WebGL fails (context lost, no GPU memory, driver error). */
  fallback: ReactNode;
  children: ReactNode;
}

/**
 * Keeps a failing 3D scene from taking the page down: the browser can refuse a WebGL context
 * even after the capability check passed, and the photo or plan is a fine stand-in.
 */
export class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.warn("3D scene unavailable, showing the still fallback:", error);
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
