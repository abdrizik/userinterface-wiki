import type { PlaybackRate } from "./types";

export const PLAYBACK_RATES: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const BASE_WINDOW = 0.02;
export const MAX_WINDOW = 0.12;

export const ICON_SIZE = {
  large: 24,
  small: 18,
} as const;

export const ICON_TRANSITION = {
  initial: { opacity: 0, scale: 0.8, filter: "blur(2px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.8, filter: "blur(2px)" },
  transition: { duration: 0.15 },
} as const;
