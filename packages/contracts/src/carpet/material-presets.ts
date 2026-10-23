import type { PileMaterial } from "./carpet.schema";

export interface ClothPhysics {
  /** Constraint solver passes per step: more passes = a stiffer sheet. */
  iterations: number;
  shearStiffness: number;
  bendStiffness: number;
  /** Velocity kept per step (0–1): lower settles faster. */
  damping: number;
  /** Pull back towards the flat rest pose per step (0–1). */
  restore: number;
  wind: number;
}

export interface PileSurface {
  roughness: number;
  sheen: number;
  sheenRoughness: number;
  sheenColor: string;
  anisotropy: number;
  clearcoat: number;
  /** Knots drawn across the carpet width in the normal map (stylised, not to scale). */
  knotsAcross: number;
  handKnotted: boolean;
  normalScale: number;
}

export interface MaterialPreset {
  physics: ClothPhysics;
  surface: PileSurface;
}

// Hand-tuned by eye, not measured from real carpets. Even silk is a heavy knotted textile: it
// drapes and keeps swinging longer than wool, but it must not ripple like liquid.
export const materialPresets: Record<PileMaterial, MaterialPreset> = {
  silk: {
    physics: {
      iterations: 10,
      shearStiffness: 0.85,
      bendStiffness: 0.07,
      damping: 0.978,
      restore: 0.0025,
      wind: 0.3,
    },
    surface: {
      roughness: 0.36,
      sheen: 0.6,
      sheenRoughness: 0.4,
      sheenColor: "#f6d58a",
      anisotropy: 0.8,
      clearcoat: 0.1,
      knotsAcross: 260,
      handKnotted: true,
      normalScale: 0.3,
    },
  },
  wool: {
    physics: {
      iterations: 12,
      shearStiffness: 0.95,
      bendStiffness: 0.16,
      damping: 0.965,
      restore: 0.0045,
      wind: 0.16,
    },
    surface: {
      roughness: 0.9,
      sheen: 0.55,
      sheenRoughness: 0.85,
      sheenColor: "#e9d7b2",
      anisotropy: 0.1,
      clearcoat: 0,
      knotsAcross: 140,
      handKnotted: true,
      normalScale: 0.85,
    },
  },
  machine: {
    physics: {
      iterations: 14,
      shearStiffness: 1,
      bendStiffness: 0.5,
      damping: 0.94,
      restore: 0.011,
      wind: 0.06,
    },
    surface: {
      roughness: 0.74,
      sheen: 0.12,
      sheenRoughness: 0.9,
      sheenColor: "#ffffff",
      anisotropy: 0,
      clearcoat: 0.08,
      knotsAcross: 190,
      handKnotted: false,
      normalScale: 0.45,
    },
  },
};
