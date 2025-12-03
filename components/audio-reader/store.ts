import { create } from "zustand";

export type AgentState = "thinking" | "listening" | "talking" | null;

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  normalized: string;
}

export type ReaderStatus = "loading" | "ready" | "error";

interface AudioReaderState {
  audioUrl: string | null;
  timestamps: WordTimestamp[];
  status: ReaderStatus;
  errorMessage: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  agentState: AgentState;
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
  reset: () => set(() => createInitialState()),
}));
