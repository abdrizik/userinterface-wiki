import { create } from "zustand";
import type {
  AgentState,
  AudioStatus,
  PlaybackRate,
  WordTimestamp,
} from "./types";

interface AudioState {
  audioUrl: string | null;
  timestamps: WordTimestamp[];
  status: AudioStatus;
  errorMessage: string | null;
  isPlaying: boolean;
  isPlayerVisible: boolean;
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
  setIsPlayerVisible: (visible: boolean) => void;
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

export type AudioStore = AudioState & AudioActions;

const createInitialState = (): AudioState => ({
  audioUrl: null,
  timestamps: [],
  status: "idle",
  errorMessage: null,
  isPlaying: false,
  isPlayerVisible: false,
  currentTime: 0,
  duration: 0,
  agentState: null,
  autoScroll: true,
  playbackRate: 1,
  volume: 1,
  isMuted: false,
  isLooping: false,
});

export const useAudioStore = create<AudioStore>((set) => ({
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
  setIsPlayerVisible: (visible) => set(() => ({ isPlayerVisible: visible })),
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
