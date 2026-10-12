import type { RoomLight } from "@farsh/contracts";

export interface LightPreset {
  sky: string;
  ground: string;
  hemisphere: number;
  sun: string;
  sunIntensity: number;
  /** Height of the sun above the floor, five metres out from the window: low light rakes across the pile. */
  sunHeight: number;
  /** Colour of the sky seen through the window glass. */
  glass: string;
  environment: number;
  /** 0 by day, 1 at night: how much the lamps and the ceiling lights carry the room. */
  night: number;
}

/**
 * Light by time of day. A carpet's reds shift between cool morning light and a warm lamp,
 * which is a question buyers actually ask, so the room lets them see it.
 */
export const lightPresets: Record<RoomLight, LightPreset> = {
  morning: {
    sky: "#e3ecff",
    ground: "#efe2cc",
    hemisphere: 1.8,
    sun: "#ffe2bc",
    sunIntensity: 2.2,
    sunHeight: 2.6,
    glass: "#fff4df",
    environment: 0.45,
    night: 0,
  },
  noon: {
    sky: "#ffffff",
    ground: "#efe6d6",
    hemisphere: 2.1,
    sun: "#fff7ec",
    sunIntensity: 1.9,
    sunHeight: 6,
    glass: "#eaf2ff",
    environment: 0.5,
    night: 0,
  },
  evening: {
    sky: "#ffd2a8",
    ground: "#6e5442",
    hemisphere: 1.1,
    sun: "#ff9a55",
    sunIntensity: 1.7,
    sunHeight: 1.3,
    glass: "#ffb47a",
    environment: 0.28,
    night: 0.55,
  },
  night: {
    sky: "#4d5878",
    ground: "#221a14",
    hemisphere: 0.42,
    sun: "#9fb2ff",
    sunIntensity: 0.14,
    sunHeight: 5,
    glass: "#1a2240",
    environment: 0.12,
    night: 1,
  },
};
