import type { PlaybackRate } from "./playback.store";

export interface Chapter {
  id: string;
  level: number;
  text: string;
  number: string;
}

export interface PlaybackProps {
  slugSegments: string[];
  title: string;
  authorName: string;
}

export interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  chapters: Chapter[];
  autoScroll: boolean;
  audioUrl: string | null;
  playbackRate: PlaybackRate;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  showChapters?: boolean;
  onToggle: () => void;
  onSeek: (value: number | number[]) => void;
  onChapterClick: (id: string) => void;
  onAutoScrollChange: (value: boolean) => void;
  onDownload: () => void;
  onPlaybackRateChange: (rate: PlaybackRate) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onLoopChange: (looping: boolean) => void;
  onCopyTimestamp: () => void;
}

export interface ChaptersMenuProps {
  chapters: Chapter[];
  onChapterClick: (id: string) => void;
}

export interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

export interface SettingsMenuProps {
  autoScroll: boolean;
  canDownload: boolean;
  isLooping: boolean;
  playbackRate: PlaybackRate;
  onAutoScrollChange: (value: boolean) => void;
  onDownload: () => void;
  onLoopChange: (looping: boolean) => void;
  onPlaybackRateChange: (rate: PlaybackRate) => void;
  onCopyTimestamp: () => void;
}
