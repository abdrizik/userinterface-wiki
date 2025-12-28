"use client";

import { Menu } from "@base-ui/react/menu";
import { Slider } from "@base-ui/react/slider";
import { Tooltip } from "@base-ui/react/tooltip";
import { FloatingPortal as Portal } from "@floating-ui/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { Orb } from "@/components/orb";
import {
  Checkmark1Icon,
  FastForwardIcon,
  PauseIcon,
  PlayIcon,
  RewindIcon,
  VoiceSettingsIcon,
  VolumeFullIcon,
  VolumeHalfIcon,
  VolumeOffIcon,
} from "@/icons";
import { getGradientColors } from "@/lib/utils";
import { normalizeWord } from "@/lib/utils/strings";
import { Button } from "../button";
import styles from "./styles.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AgentState = "thinking" | "listening" | "talking" | null;
type AudioStatus = "idle" | "loading" | "ready" | "error";
type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  normalized: string;
}

export interface AudioProps {
  slug: string[];
  title: string;
  author: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

interface AudioState {
  audioUrl: string | null;
  timestamps: WordTimestamp[];
  status: AudioStatus;
  errorMessage: string | null;
  isPlaying: boolean;
  isVisible: boolean;
  currentTime: number;
  duration: number;
  agentState: AgentState;
  autoScroll: boolean;
  playbackRate: PlaybackRate;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
}

interface AudioActions {
  setAudioData: (payload: {
    audioUrl: string | null;
    timestamps: WordTimestamp[];
  }) => void;
  setStatus: (status: AudioStatus) => void;
  setError: (message: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsVisible: (visible: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAgentState: (agentState: AgentState) => void;
  setAutoScroll: (enabled: boolean) => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setIsLooping: (looping: boolean) => void;
  reset: () => void;
}

type AudioStore = AudioState & AudioActions;

const createInitialState = (): AudioState => ({
  audioUrl: null,
  timestamps: [],
  status: "idle",
  errorMessage: null,
  isPlaying: false,
  isVisible: false,
  currentTime: 0,
  duration: 0,
  agentState: null,
  autoScroll: true,
  playbackRate: 1,
  volume: 1,
  isMuted: false,
  isLooping: false,
});

const useAudioStore = create<AudioStore>((set) => ({
  ...createInitialState(),
  setAudioData: ({ audioUrl, timestamps }) =>
    set(() => ({ audioUrl, timestamps })),
  setStatus: (status) =>
    set((state) => ({
      status,
      errorMessage: status === "error" ? state.errorMessage : null,
    })),
  setError: (message) => set(() => ({ errorMessage: message })),
  setIsPlaying: (isPlaying) => set(() => ({ isPlaying })),
  setIsVisible: (visible) => set(() => ({ isVisible: visible })),
  setCurrentTime: (time) => set(() => ({ currentTime: time })),
  setDuration: (duration) => set(() => ({ duration })),
  setAgentState: (agentState) => set(() => ({ agentState })),
  setAutoScroll: (enabled) => set(() => ({ autoScroll: enabled })),
  setPlaybackRate: (rate) => set(() => ({ playbackRate: rate })),
  setVolume: (volume) =>
    set(() => ({ volume: Math.max(0, Math.min(1, volume)) })),
  setIsMuted: (muted) => set(() => ({ isMuted: muted })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setIsLooping: (looping) => set(() => ({ isLooping: looping })),
  reset: () => set(() => createInitialState()),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Exported Hook for External Control
// ─────────────────────────────────────────────────────────────────────────────

export function useAudioControls() {
  return useAudioStore(
    useShallow((state) => ({
      isPlaying: state.isPlaying,
      isVisible: state.isVisible,
      status: state.status,
      setIsVisible: state.setIsVisible,
    })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PLAYBACK_RATES: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
const BASE_WINDOW = 0.02;
const MAX_WINDOW = 0.12;

const ICON_SIZE = {
  large: 24,
  small: 18,
};

const ICON_TRANSITION = {
  initial: { opacity: 0, scale: 0.8, filter: "blur(2px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.8, filter: "blur(2px)" },
  transition: { duration: 0.15 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function resolveWindow(entry: WordTimestamp): number {
  const span = Math.max(
    BASE_WINDOW,
    Math.abs((entry.end ?? 0) - (entry.start ?? 0)),
  );
  return Math.min(MAX_WINDOW, span * 0.5);
}

interface SpanMeta {
  element: HTMLElement;
  normalized: string;
}

function collectSpans(): SpanMeta[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-word-id]"),
  ).map((element) => ({
    element,
    normalized:
      element.dataset.wordNormalized ||
      normalizeWord(element.textContent ?? ""),
  }));
}

function alignTimeline(
  timestamps: WordTimestamp[],
  spans: SpanMeta[],
): number[] {
  const mapping: number[] = new Array(timestamps.length).fill(-1);
  let spanIndex = 0;

  for (let entryIndex = 0; entryIndex < timestamps.length; entryIndex++) {
    const normalized = timestamps[entryIndex]?.normalized;
    if (!normalized) continue;

    for (let i = spanIndex; i < spans.length; i++) {
      const candidate = spans[i];
      if (!candidate?.normalized) continue;
      if (candidate.normalized === normalized) {
        mapping[entryIndex] = i;
        spanIndex = i + 1;
        break;
      }
    }
  }

  return mapping;
}

function locateWordIndex(
  currentTime: number,
  timestamps: WordTimestamp[],
  lastIndex: number,
): number {
  if (!timestamps.length) return -1;

  const startOf = (entry: WordTimestamp) => entry.start ?? entry.end ?? 0;
  const endOf = (entry: WordTimestamp) => entry.end ?? entry.start ?? 0;

  const clampedLastIndex = Math.max(
    -1,
    Math.min(lastIndex, timestamps.length - 1),
  );

  if (clampedLastIndex >= 0) {
    const previous = timestamps[clampedLastIndex];
    if (previous) {
      const window = resolveWindow(previous);
      const prevStart = startOf(previous) - window;
      const prevEnd = endOf(previous) + window;

      if (currentTime >= prevStart && currentTime <= prevEnd) {
        return clampedLastIndex;
      }
    }
  }

  let index = clampedLastIndex;

  const firstTimestamp = timestamps[0];
  if (index === -1) {
    if (firstTimestamp && currentTime < startOf(firstTimestamp) - BASE_WINDOW) {
      return -1;
    }
    index = 0;
  }

  while (
    index + 1 < timestamps.length &&
    timestamps[index + 1] &&
    currentTime >= startOf(timestamps[index + 1]!) - BASE_WINDOW
  ) {
    index += 1;
  }

  while (
    index > 0 &&
    timestamps[index] &&
    currentTime < startOf(timestamps[index]!) - BASE_WINDOW
  ) {
    index -= 1;
  }

  const current = timestamps[index];
  if (!current) return index;

  const currentStart = startOf(current);
  const currentEnd = endOf(current);
  const window = resolveWindow(current);
  const withinCurrent =
    currentTime >= currentStart - window && currentTime <= currentEnd + window;

  if (withinCurrent) {
    return index;
  }

  if (currentTime > currentEnd + window) {
    if (index + 1 >= timestamps.length) {
      return timestamps.length - 1;
    }

    const nextTimestamp = timestamps[index + 1];
    if (nextTimestamp) {
      const nextStart = startOf(nextTimestamp);
      if (currentTime < nextStart - BASE_WINDOW) {
        return index;
      }
    }

    return index + 1;
  }

  if (currentTime < currentStart - window) {
    if (index === 0) {
      return -1;
    }
    return index - 1;
  }

  return index;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

function useAudio({ slug, title, author }: AudioProps) {
  const slugKey = useMemo(() => slug?.join("/") ?? "", [slug]);

  const colors = useMemo(
    () => getGradientColors(slug?.join("-") ?? ""),
    [slug],
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const spansRef = useRef<SpanMeta[]>([]);
  const mappingRef = useRef<number[]>([]);
  const activeSpanRef = useRef<HTMLElement | null>(null);
  const activeBlockRef = useRef<HTMLElement | null>(null);
  const lastWordIndexRef = useRef(-1);
  const isUserScrollingRef = useRef(false);
  const scrollTimerRef = useRef<number | null>(null);

  const {
    audioUrl,
    timestamps,
    status,
    errorMessage,
    isPlaying,
    isVisible,
    currentTime,
    duration,
    agentState,
    autoScroll,
    playbackRate,
    volume,
    isMuted,
    isLooping,
    setAudioData,
    setStatus,
    setError,
    setIsPlaying,
    setIsVisible,
    setCurrentTime,
    setDuration,
    setAgentState,
    setAutoScroll,
    setPlaybackRate,
    setVolume,
    toggleMute,
    setIsLooping,
    reset,
  } = useAudioStore(
    useShallow((state) => ({
      audioUrl: state.audioUrl,
      timestamps: state.timestamps,
      status: state.status,
      errorMessage: state.errorMessage,
      isPlaying: state.isPlaying,
      isVisible: state.isVisible,
      currentTime: state.currentTime,
      duration: state.duration,
      agentState: state.agentState,
      autoScroll: state.autoScroll,
      playbackRate: state.playbackRate,
      volume: state.volume,
      isMuted: state.isMuted,
      isLooping: state.isLooping,
      setAudioData: state.setAudioData,
      setStatus: state.setStatus,
      setError: state.setError,
      setIsPlaying: state.setIsPlaying,
      setIsVisible: state.setIsVisible,
      setCurrentTime: state.setCurrentTime,
      setDuration: state.setDuration,
      setAgentState: state.setAgentState,
      setAutoScroll: state.setAutoScroll,
      setPlaybackRate: state.setPlaybackRate,
      setVolume: state.setVolume,
      toggleMute: state.toggleMute,
      setIsLooping: state.setIsLooping,
      reset: state.reset,
    })),
  );

  // Reset state on mount
  useEffect(() => {
    reset();
  }, [reset]);

  const startTicker = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const frame = () => {
      if (!audioRef.current) return;
      setCurrentTime(audioRef.current.currentTime);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [setCurrentTime]);

  const clearActiveHighlight = useCallback(() => {
    if (activeSpanRef.current) {
      delete activeSpanRef.current.dataset.wordState;
      activeSpanRef.current = null;
    }

    if (activeBlockRef.current) {
      delete activeBlockRef.current.dataset.wordBlockState;
      activeBlockRef.current = null;
    }
  }, []);

  // Fetch narration
  useEffect(() => {
    // Skip fetch if no slug
    if (!slugKey) {
      return;
    }

    const controller = new AbortController();

    const fetchNarration = async () => {
      setStatus("loading");
      setError(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setAudioData({ audioUrl: null, timestamps: [] });
      lastWordIndexRef.current = -1;

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: slugKey }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const { error } = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(error ?? "Unable to load narration");
        }

        const data = (await response.json()) as {
          audioUrl: string;
          timestamps: WordTimestamp[];
        };

        setAudioData({
          audioUrl: data.audioUrl ?? null,
          timestamps: data.timestamps ?? [],
        });
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[audio]", error);
        setAudioData({ audioUrl: null, timestamps: [] });
        setIsPlaying(false);
        setError("Audio unavailable");
        setStatus("error");
      }
    };

    fetchNarration();

    return () => controller.abort();
  }, [
    slugKey,
    setAudioData,
    setError,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setStatus,
  ]);

  // Collect word spans
  useEffect(() => {
    if (!slugKey) return;

    spansRef.current = collectSpans();
    mappingRef.current = [];
    activeSpanRef.current = null;
    activeBlockRef.current = null;
    lastWordIndexRef.current = -1;
  }, [slugKey]);

  // Align timestamps to DOM
  useEffect(() => {
    if (!timestamps.length || !spansRef.current.length) {
      mappingRef.current = [];
      return;
    }

    const mapping = alignTimeline(timestamps, spansRef.current);
    mappingRef.current = mapping;

    for (const meta of spansRef.current) {
      delete meta.element.dataset.wordTimeIndex;
    }

    mapping.forEach((spanIndex, wordIndex) => {
      if (spanIndex < 0) return;
      const meta = spansRef.current[spanIndex];
      if (!meta) return;
      meta.element.dataset.wordTimeIndex = String(wordIndex);
    });
  }, [timestamps]);

  // User scroll detection
  useEffect(() => {
    const markScrolling = () => {
      isUserScrollingRef.current = true;
      if (typeof scrollTimerRef.current === "number") {
        window.clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = window.setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1200);
    };

    window.addEventListener("wheel", markScrolling, { passive: true });
    window.addEventListener("touchmove", markScrolling, { passive: true });

    return () => {
      window.removeEventListener("wheel", markScrolling);
      window.removeEventListener("touchmove", markScrolling);
      if (typeof scrollTimerRef.current === "number") {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  // Visibility change sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      const audio = audioRef.current;
      if (!audio) return;

      const actualTime = audio.currentTime;
      setCurrentTime(actualTime);
      lastWordIndexRef.current = -1;

      if (!audio.paused && isPlaying) {
        startTicker();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying, setCurrentTime, startTicker]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const handleMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setAgentState(null);
      setCurrentTime(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastWordIndexRef.current = -1;
      clearActiveHighlight();
    };
    const handlePause = () => {
      setIsPlaying(false);
      setAgentState(null);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastWordIndexRef.current = -1;
      clearActiveHighlight();
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setAgentState("talking");
    };

    audio.addEventListener("loadedmetadata", handleMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audioRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    clearActiveHighlight,
    setAgentState,
    setCurrentTime,
    setDuration,
    setIsPlaying,
  ]);

  // Load audio source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioUrl) {
      audio.src = "";
      audio.load();
      return;
    }

    audio.src = audioUrl;
    audio.currentTime = 0;
    audio.load();
  }, [audioUrl]);

  const handleToggle = useCallback(async () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setIsPlaying(false);
      setAgentState(null);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setAgentState("talking");
      startTicker();
    } catch (error) {
      console.error("[audio]", error);
      setError("Playback failed");
      setStatus("error");
    }
  }, [
    audioUrl,
    isPlaying,
    setAgentState,
    setError,
    setStatus,
    startTicker,
    setIsPlaying,
  ]);

  const seek = useCallback(
    (time: number) => {
      if (!audioRef.current) return;
      const clampedTime = Math.max(0, Math.min(time, duration));
      audioRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
      lastWordIndexRef.current = -1;
    },
    [duration, setCurrentTime],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handleToggle();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(audio.currentTime - 5);
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(audio.currentTime + 5);
          break;
        case "KeyJ":
          e.preventDefault();
          seek(audio.currentTime - 15);
          break;
        case "KeyL":
          e.preventDefault();
          seek(audio.currentTime + 15);
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggle, seek, toggleMute]);

  // Media Session API artwork
  const artworkUrl = useMemo(() => {
    if (typeof document === "undefined") return null;

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );

    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return canvas.toDataURL("image/png");
  }, [colors]);

  // Media Session API
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const artwork: MediaImage[] = artworkUrl
      ? [{ src: artworkUrl, sizes: "512x512", type: "image/png" }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: author,
      album: "userinterface.wiki",
      artwork,
    });

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });

    navigator.mediaSession.setActionHandler("seekbackward", () => {
      const audio = audioRef.current;
      if (audio) seek(audio.currentTime - 15);
    });

    navigator.mediaSession.setActionHandler("seekforward", () => {
      const audio = audioRef.current;
      if (audio) seek(audio.currentTime + 15);
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime);
      }
    });

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  }, [artworkUrl, author, seek, title]);

  // Media Session playback state
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Media Session position state
  useEffect(() => {
    if (!("mediaSession" in navigator) || duration === 0) return;
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position: currentTime,
    });
  }, [currentTime, duration]);

  const applyHighlight = useCallback(
    (wordIndex: number) => {
      const spanIndex = mappingRef.current[wordIndex];
      if (typeof spanIndex !== "number" || spanIndex < 0) return;

      const meta = spansRef.current[spanIndex];
      if (!meta || activeSpanRef.current === meta.element) return;

      clearActiveHighlight();
      activeSpanRef.current = meta.element;
      activeSpanRef.current.dataset.wordState = "active";

      const block = meta.element.closest<HTMLElement>(
        "p, li, blockquote, h1, h2, h3, h4, h5, h6",
      );
      if (block) {
        activeBlockRef.current = block;
        block.dataset.wordBlockState = "active";
      }

      if (!autoScroll || isUserScrollingRef.current) return;

      const rect = meta.element.getBoundingClientRect();
      const offset = window.innerHeight * 0.2;
      const outOfView =
        rect.top < offset || rect.bottom > window.innerHeight - offset;

      if (outOfView) {
        meta.element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    [autoScroll, clearActiveHighlight],
  );

  // Word highlighting
  useEffect(() => {
    if (!timestamps.length || !isPlaying) return;

    const nextIndex = locateWordIndex(
      currentTime,
      timestamps,
      lastWordIndexRef.current,
    );

    if (nextIndex === lastWordIndexRef.current) return;

    lastWordIndexRef.current = nextIndex;

    if (nextIndex === -1) {
      clearActiveHighlight();
      return;
    }

    applyHighlight(nextIndex);
  }, [
    applyHighlight,
    clearActiveHighlight,
    currentTime,
    isPlaying,
    timestamps,
  ]);

  // Clear highlight when paused
  useEffect(() => {
    if (isPlaying) return;
    lastWordIndexRef.current = -1;
    clearActiveHighlight();
  }, [clearActiveHighlight, isPlaying]);

  // Sync playback rate
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync looping
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = isLooping;
    }
  }, [isLooping]);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (audio) seek(audio.currentTime + 15);
  }, [seek]);

  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (audio) seek(audio.currentTime - 15);
  }, [seek]);

  const handleDownload = useCallback(() => {
    if (!audioUrl || !slug?.length) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${slug.join("-")}.mp3`;
    link.click();
  }, [audioUrl, slug]);

  // Scroll direction detection
  const lastScrollYRef = useRef(0);
  const hasBeenShownRef = useRef(false);

  useEffect(() => {
    // Track if player has ever been shown
    if (isVisible) {
      hasBeenShownRef.current = true;
    }
  }, [isVisible]);

  useEffect(() => {
    // Only run scroll detection if the player has been shown at least once
    if (!hasBeenShownRef.current) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      // Only respond to significant scroll
      if (Math.abs(delta) < 10) {
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (delta > 0 && currentScrollY > 100 && isVisible) {
        // Scrolling down - hide
        setIsVisible(false);
      } else if (delta < 0 && !isVisible && isPlaying) {
        // Scrolling up - show (only if audio is playing)
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVisible, isPlaying, setIsVisible]);

  // Show player and start playback
  const showAndPlay = useCallback(async () => {
    setIsVisible(true);
    if (!isPlaying) {
      await handleToggle();
    }
  }, [handleToggle, isPlaying, setIsVisible]);

  // Hide player
  const hide = useCallback(() => {
    setIsVisible(false);
    if (isPlaying) {
      audioRef.current?.pause();
    }
  }, [isPlaying, setIsVisible]);

  return {
    status,
    errorMessage,
    isPlaying,
    isVisible,
    audioUrl,
    duration,
    currentTime,
    agentState,
    handleToggle,
    showAndPlay,
    hide,
    seek,
    skipForward,
    skipBackward,
    autoScroll,
    setAutoScroll,
    playbackRate,
    setPlaybackRate,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isLooping,
    setIsLooping,
    handleDownload,
    colors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function Background() {
  return <div className={styles.background} />;
}

interface TooltipButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  label: string;
  shortcut?: string;
}

function TooltipButton({
  label,
  shortcut,
  children,
  ...props
}: TooltipButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <Button variant="ghost" className={styles.button} {...props}>
            {children}
          </Button>
        }
      />
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8} side="top">
          <Tooltip.Popup className={styles.tooltip}>
            <span>{label}</span>
            {shortcut && <kbd className={styles.kbd}>{shortcut}</kbd>}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
}: VolumeControlProps) {
  const VolumeIcon = isMuted
    ? VolumeOffIcon
    : volume > 0.5
      ? VolumeFullIcon
      : VolumeHalfIcon;

  return (
    <Menu.Root>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <Menu.Trigger
              render={
                <Button
                  variant="ghost"
                  className={styles.button}
                  aria-label="Volume"
                >
                  <VolumeIcon size={ICON_SIZE.small} />
                </Button>
              }
            />
          }
        />
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8} side="top">
            <Tooltip.Popup className={styles.tooltip}>
              <span>Volume</span>
              <kbd className={styles.kbd}>M</kbd>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Menu.Portal>
        <Menu.Positioner
          className={styles.positioner}
          sideOffset={8}
          align="center"
          side="top"
        >
          <Menu.Popup className={styles.volume}>
            <Slider.Root
              value={isMuted ? 0 : volume * 100}
              onValueChange={(value) => {
                const v = Array.isArray(value) ? value[0] : value;
                if (v !== undefined) onVolumeChange(v / 100);
              }}
              orientation="vertical"
              aria-label="Volume"
              className={styles["volume-slider"]}
            >
              <Slider.Control className={styles["volume-control"]}>
                <Slider.Track className={styles["volume-track"]}>
                  <Slider.Indicator className={styles["volume-indicator"]} />
                  <Slider.Thumb className={styles["volume-thumb"]} />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
            <Button
              variant="ghost"
              className={styles.button}
              onClick={onMuteToggle}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              <VolumeFullIcon size={ICON_SIZE.small} />
            </Button>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

interface SettingsMenuProps {
  autoScroll: boolean;
  canDownload: boolean;
  isLooping: boolean;
  playbackRate: PlaybackRate;
  onAutoScrollChange: (value: boolean) => void;
  onDownload: () => void;
  onLoopChange: (looping: boolean) => void;
  onPlaybackRateChange: (rate: PlaybackRate) => void;
}

function SettingsMenu(props: SettingsMenuProps) {
  return (
    <Menu.Root>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <Menu.Trigger
              render={
                <Button
                  variant="ghost"
                  className={styles.button}
                  aria-label="Settings"
                >
                  <VoiceSettingsIcon size={ICON_SIZE.large} />
                </Button>
              }
            />
          }
        />
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8} side="top">
            <Tooltip.Popup className={styles.tooltip}>
              <span>Settings</span>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Menu.Portal>
        <Menu.Positioner
          className={styles.positioner}
          sideOffset={16}
          align="end"
          side="top"
        >
          <Menu.Popup className={styles.menu}>
            <Menu.CheckboxItem
              checked={props.autoScroll}
              onCheckedChange={props.onAutoScrollChange}
              className={styles.item}
            >
              Auto-scroll
              <Menu.CheckboxItemIndicator
                className={styles.check}
                keepMounted
                render={
                  <AnimatePresence initial={false}>
                    {props.autoScroll && (
                      <motion.div key="auto-scroll" {...ICON_TRANSITION}>
                        <Checkmark1Icon size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                }
              />
            </Menu.CheckboxItem>

            <Menu.CheckboxItem
              checked={props.isLooping}
              onCheckedChange={props.onLoopChange}
              className={styles.item}
            >
              Loop
              <Menu.CheckboxItemIndicator
                className={styles.check}
                keepMounted
                render={
                  <AnimatePresence initial={false}>
                    {props.isLooping && (
                      <motion.div key="loop" {...ICON_TRANSITION}>
                        <Checkmark1Icon size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                }
              />
            </Menu.CheckboxItem>

            <Menu.Separator className={styles.separator} />

            <Menu.Group className={styles.group}>
              <Menu.GroupLabel className={styles.label}>Speed</Menu.GroupLabel>
              <Menu.RadioGroup value={props.playbackRate.toString()}>
                {PLAYBACK_RATES.map((rate) => (
                  <Menu.RadioItem
                    key={rate}
                    value={rate.toString()}
                    closeOnClick={false}
                    onClick={() => props.onPlaybackRateChange(rate)}
                    className={styles.item}
                  >
                    <span>{rate}×</span>
                    <Menu.RadioItemIndicator
                      className={styles.check}
                      keepMounted
                      render={
                        <AnimatePresence initial={false}>
                          {props.playbackRate === rate && (
                            <motion.div
                              key={`speed-${rate}`}
                              {...ICON_TRANSITION}
                            >
                              <Checkmark1Icon size={16} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      }
                    />
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Group>

            <Menu.Separator className={styles.separator} />

            <Menu.Item
              className={styles.item}
              onClick={props.onDownload}
              disabled={!props.canDownload}
            >
              Download Audio
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function AudioPlayer({ slug, title, author }: AudioProps) {
  const {
    status,
    isPlaying,
    isVisible,
    duration,
    currentTime,
    agentState,
    handleToggle,
    seek,
    skipForward,
    skipBackward,
    autoScroll,
    setAutoScroll,
    playbackRate,
    setPlaybackRate,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isLooping,
    setIsLooping,
    handleDownload,
    audioUrl,
    colors,
  } = useAudio({ slug, title, author });

  const progress =
    duration > 0
      ? Math.min(Math.max((currentTime / duration) * 100, 0), 100)
      : 0;

  const handleSeek = useCallback(
    (value: number | number[]) => {
      const percent = Array.isArray(value) ? value[0] : value;
      if (percent === undefined || duration <= 0) return;
      seek((percent / 100) * duration);
    },
    [duration, seek],
  );

  // Don't render if props are missing or audio isn't available
  if (
    !slug?.length ||
    status === "idle" ||
    status === "loading" ||
    status === "error"
  ) {
    return null;
  }

  return (
    <Portal>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={styles.audio}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <Background />
            <div className={styles["audio-controls"]}>
              <div className={styles.details}>
                <div className={styles.cover}>
                  <Orb
                    colors={colors}
                    agentState={agentState}
                    className={styles.shader}
                  />
                </div>
                <div className={styles.info}>
                  <div className={styles.title}>{title}</div>
                  <div className={styles.author}>{author}</div>
                </div>
              </div>
              <div className={styles.progress}>
                <span className={styles.time}>{formatTime(currentTime)}</span>
                <Slider.Root
                  value={progress}
                  onValueChange={handleSeek}
                  aria-label="Playback progress"
                  className={styles.slider}
                >
                  <Slider.Control className={styles.control}>
                    <Slider.Track className={styles.track}>
                      <Slider.Indicator className={styles.indicator} />
                      <Slider.Thumb className={styles.thumb} />
                    </Slider.Track>
                  </Slider.Control>
                </Slider.Root>
                <span className={styles.time}>{formatTime(duration)}</span>
              </div>
              <div className={styles.controls}>
                <VolumeControl
                  volume={volume}
                  isMuted={isMuted}
                  onVolumeChange={setVolume}
                  onMuteToggle={toggleMute}
                />
                <div className={styles.options}>
                  <TooltipButton
                    onClick={skipBackward}
                    aria-label="Rewind 15 seconds"
                    label="Rewind"
                    shortcut="-15s"
                  >
                    <RewindIcon size={ICON_SIZE.small} />
                  </TooltipButton>
                  <TooltipButton
                    onClick={handleToggle}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    label={isPlaying ? "Pause" : "Play"}
                    shortcut="Space"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isPlaying ? (
                        <motion.div {...ICON_TRANSITION} key="pause">
                          <PauseIcon size={ICON_SIZE.large} />
                        </motion.div>
                      ) : (
                        <motion.div {...ICON_TRANSITION} key="play">
                          <PlayIcon size={ICON_SIZE.large} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TooltipButton>
                  <TooltipButton
                    onClick={skipForward}
                    aria-label="Fast forward 15 seconds"
                    label="Fast Forward"
                    shortcut="+15s"
                  >
                    <FastForwardIcon size={ICON_SIZE.small} />
                  </TooltipButton>
                </div>
                <SettingsMenu
                  autoScroll={autoScroll}
                  canDownload={!!audioUrl}
                  isLooping={isLooping}
                  playbackRate={playbackRate}
                  onAutoScrollChange={setAutoScroll}
                  onDownload={handleDownload}
                  onLoopChange={setIsLooping}
                  onPlaybackRateChange={setPlaybackRate}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
