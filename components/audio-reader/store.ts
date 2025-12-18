import { create } from "zustand";

export type AgentState = "thinking" | "listening" | "talking" | null;

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  normalized: string;
}

export type ReaderStatus = "loading" | "ready" | "error";

export type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

interface AudioReaderState {
  audioUrl: string | null;
  timestamps: WordTimestamp[];
  status: ReaderStatus;
  errorMessage: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  agentState: AgentState;
  autoScroll: boolean;
  playbackRate: PlaybackRate;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
}

interface AudioReaderActions {
  setAudioData: (payload: {
    audioUrl: string | null;
    timestamps: WordTimestamp[];
  }) => void;
  setStatus: (status: ReaderStatus) => void;
  setError: (message: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
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

type AudioReaderStore = AudioReaderState & AudioReaderActions;

const createInitialState = (): AudioReaderState => ({
  audioUrl: null,
  timestamps: [],
  status: "loading",
  errorMessage: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  agentState: null,
  autoScroll: true,
  playbackRate: 1,
  volume: 1,
  isMuted: false,
  isLooping: false,
});

export const useAudioReaderStore = create<AudioReaderStore>((set) => ({
  ...createInitialState(),
  setAudioData: ({ audioUrl, timestamps }) =>
    set(() => ({ audioUrl, timestamps })),
  setStatus: (status) =>
    set((state) => ({
      status,
      errorMessage: status === "error" ? state.errorMessage : null,
    })),
  setError: (message) =>
    set(() => ({
      errorMessage: message,
    })),
  setIsPlaying: (isPlaying) => set(() => ({ isPlaying })),
  setCurrentTime: (time) => set(() => ({ currentTime: time })),
  setDuration: (duration) => set(() => ({ duration })),
  setAgentState: (agentState) => set(() => ({ agentState })),
  setAutoScroll: (enabled) => set(() => ({ autoScroll: enabled })),
  setPlaybackRate: (rate) => set(() => ({ playbackRate: rate })),
  setVolume: (volume) => set(() => ({ volume: Math.max(0, Math.min(1, volume)) })),
  setIsMuted: (muted) => set(() => ({ isMuted: muted })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setIsLooping: (looping) => set(() => ({ isLooping: looping })),
  reset: () => set(() => createInitialState()),
}));
