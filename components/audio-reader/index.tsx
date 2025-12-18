"use client";

import { Button } from "@base-ui-components/react/button";
import { Menu } from "@base-ui-components/react/menu";
import { Slider } from "@base-ui-components/react/slider";
import { Tooltip } from "@base-ui-components/react/tooltip";
import { Portal } from "@radix-ui/react-portal";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import type { ComponentProps } from "react";
import React from "react";
import {
  CheckIcon,
  FastForward15sIcon,
  GearIcon,
  PauseIcon,
  PlayIcon,
  PlaylistIcon,
  RepeatIcon,
  Rewind15sIcon,
  ShareIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMuteIcon,
} from "@/components/icons";
import type { PlaybackRate } from "./store";
import { Orb } from "../orb";
import styles from "./styles.module.css";
import { useAudioReader } from "./use-audio-reader";
import { formatTime } from "./utils";

interface Chapter {
  id: string;
  level: number;
  text: string;
  number: string;
}

interface AudioReaderProps {
  slugSegments: string[];
  title: string;
  authorName: string;
}

const ICON_TRANSITION = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: 0.18 },
};

export const AudioReader = ({
  slugSegments,
  title,
  authorName,
}: AudioReaderProps) => {
  const {
    status,
    isPlaying,
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
    copyTimestampUrl,
    audioUrl,
    colors,
  } = useAudioReader({ slugSegments, title, authorName });

  const readerRef = React.useRef<HTMLDivElement | null>(null);
  const [isReaderVisible, setIsReaderVisible] = React.useState(true);
  const [chapters, setChapters] = React.useState<Chapter[]>([]);

  React.useEffect(() => {
    const headings = document.querySelectorAll<HTMLHeadingElement>(
      "article h1, article h2, article h3, article h4, article h5, article h6",
    );

    if (headings.length === 0) {
      setChapters([]);
      return;
    }

    const levels = Array.from(headings).map((h) =>
      parseInt(h.tagName.charAt(1), 10),
    );
    const minLevel = Math.min(...levels);

    const collected: Chapter[] = [];
    const counters = [0, 0, 0, 0, 0, 0];

    headings.forEach((heading) => {
      const id =
        heading.id ||
        heading.textContent?.toLowerCase().replace(/\s+/g, "-") ||
        "";
      if (!heading.id && id) heading.id = id;

      const level = parseInt(heading.tagName.charAt(1), 10);
      const levelIndex = level - minLevel;

      counters[levelIndex]++;
      for (let i = levelIndex + 1; i < counters.length; i++) {
        counters[i] = 0;
      }

      const number = counters
        .slice(0, levelIndex + 1)
        .filter((n) => n > 0)
        .join(".");

      collected.push({
        id,
        level,
        text: heading.textContent || "",
        number,
      });
    });

    setChapters(collected);
  }, []);

  const scrollToChapter = React.useCallback((id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleDownload = React.useCallback(() => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${slugSegments.join("-")}.mp3`;
    link.click();
  }, [audioUrl, slugSegments]);

  const progress =
    duration > 0
      ? Math.min(Math.max((currentTime / duration) * 100, 0), 100)
      : 0;

  const handleSeek = React.useCallback(
    (value: number | number[]) => {
      const percent = Array.isArray(value) ? value[0] : value;
      if (percent === undefined || duration <= 0) return;
      seek((percent / 100) * duration);
    },
    [duration, seek],
  );

  React.useEffect(() => {
    const target = readerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsReaderVisible(entry?.isIntersecting ?? false),
      { threshold: 0.4 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const controlsProps = {
    isPlaying,
    currentTime,
    duration,
    progress,
    chapters,
    autoScroll,
    audioUrl,
    playbackRate,
    volume,
    isMuted,
    isLooping,
    onToggle: handleToggle,
    onSeek: handleSeek,
    onSkipForward: skipForward,
    onSkipBackward: skipBackward,
    onChapterClick: scrollToChapter,
    onAutoScrollChange: setAutoScroll,
    onDownload: handleDownload,
    onPlaybackRateChange: setPlaybackRate,
    onVolumeChange: setVolume,
    onMuteToggle: toggleMute,
    onLoopChange: setIsLooping,
    onCopyTimestamp: copyTimestampUrl,
  };

  return (
    <React.Fragment>
      <div ref={readerRef} className={styles.reader}>
        <Orb colors={colors} agentState={agentState} className={styles.orb} />
        {status !== "loading" && (
          <motion.div
            className={styles.controls}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ease: [0.19, 1, 0.22, 1] }}
          >
            <Controls {...controlsProps} />
          </motion.div>
        )}
      </div>

      <Portal className={styles.floating}>
        <AnimatePresence mode="sync">
          {!isReaderVisible && status !== "loading" && (
            <motion.div
              initial={{ backdropFilter: "blur(0px) opacity(0)" }}
              animate={{ backdropFilter: "blur(6px) opacity(1)" }}
              exit={{ backdropFilter: "blur(0px) opacity(0)" }}
              transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
              className={styles.background}
            />
          )}
        </AnimatePresence>
        <AnimatePresence mode="sync">
          {!isReaderVisible && status !== "loading" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: "blur(2px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(2px)" }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className={styles.controls}
              style={{ bottom: 48 }}
            >
              <Controls {...controlsProps} showChapters={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </React.Fragment>
  );
};

interface ControlsProps {
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
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onChapterClick: (id: string) => void;
  onAutoScrollChange: (value: boolean) => void;
  onDownload: () => void;
  onPlaybackRateChange: (rate: PlaybackRate) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onLoopChange: (looping: boolean) => void;
  onCopyTimestamp: () => void;
}

const PLAYBACK_RATES: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

const Controls = ({
  isPlaying,
  currentTime,
  duration,
  progress,
  chapters,
  autoScroll,
  audioUrl,
  playbackRate,
  volume,
  isMuted,
  isLooping,
  showChapters = true,
  onToggle,
  onSeek,
  onSkipForward,
  onSkipBackward,
  onChapterClick,
  onAutoScrollChange,
  onDownload,
  onPlaybackRateChange,
  onVolumeChange,
  onMuteToggle,
  onLoopChange,
  onCopyTimestamp,
}: ControlsProps) => (
  <React.Fragment>
    <TooltipButton
      onClick={onSkipBackward}
      aria-label="Rewind 15 seconds"
      label="Rewind"
      shortcut="J"
    >
      <Rewind15sIcon />
    </TooltipButton>

    <TooltipButton
      onClick={onToggle}
      aria-label={isPlaying ? "Pause" : "Play"}
      label={isPlaying ? "Pause" : "Play"}
      shortcut="Space"
    >
      <AnimatePresence mode="wait">
        {isPlaying ? (
          <motion.div {...ICON_TRANSITION} key="pause">
            <PauseIcon />
          </motion.div>
        ) : (
          <motion.div {...ICON_TRANSITION} key="play">
            <PlayIcon />
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipButton>

    <TooltipButton
      onClick={onSkipForward}
      aria-label="Forward 15 seconds"
      label="Forward"
      shortcut="L"
    >
      <FastForward15sIcon />
    </TooltipButton>

    {showChapters && (
      <ChaptersMenu chapters={chapters} onChapterClick={onChapterClick} />
    )}

    <VolumeControl
      volume={volume}
      isMuted={isMuted}
      onVolumeChange={onVolumeChange}
      onMuteToggle={onMuteToggle}
    />

    <Slider.Root
      value={progress}
      onValueChange={onSeek}
      aria-label="Playback progress"
      className={clsx(
        styles.slider,
        showChapters ? styles.withChapters : undefined,
      )}
    >
      <Time>{formatTime(currentTime)}</Time>
      <Slider.Control className={styles.control}>
        <Slider.Track className={styles.track}>
          <Slider.Indicator className={styles.indicator} />
          <Slider.Thumb className={styles.thumb} />
        </Slider.Track>
      </Slider.Control>
      <Time>{formatTime(duration)}</Time>
    </Slider.Root>

    <PlaybackRateMenu
      playbackRate={playbackRate}
      onPlaybackRateChange={onPlaybackRateChange}
    />

    <SettingsMenu
      autoScroll={autoScroll}
      canDownload={!!audioUrl}
      isLooping={isLooping}
      onAutoScrollChange={onAutoScrollChange}
      onDownload={onDownload}
      onLoopChange={onLoopChange}
      onCopyTimestamp={onCopyTimestamp}
    />
  </React.Fragment>
);

interface ChaptersMenuProps {
  chapters: Chapter[];
  onChapterClick: (id: string) => void;
}

const ChaptersMenu = ({ chapters, onChapterClick }: ChaptersMenuProps) => (
  <Menu.Root>
    <Menu.Trigger render={<MediaPlayerButton aria-label="Chapters" />}>
      <PlaylistIcon />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner
        className={styles.positioner}
        sideOffset={8}
        align="end"
        side="top"
      >
        <Menu.Popup className={styles.popup}>
          {chapters.length > 0 ? (
            chapters.map((chapter) => (
              <Menu.Item
                key={chapter.id}
                className={styles.item}
                style={{ paddingLeft: `${(chapter.level - 1) * 12}px` }}
                onClick={() => onChapterClick(chapter.id)}
              >
                {chapter.number}. {chapter.text}
              </Menu.Item>
            ))
          ) : (
            <Menu.Item className={styles.item} disabled>
              No chapters
            </Menu.Item>
          )}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
);

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

const VolumeControl = ({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
}: VolumeControlProps) => {
  const VolumeIcon = isMuted
    ? VolumeMuteIcon
    : volume > 0.5
      ? VolumeHighIcon
      : VolumeLowIcon;

  return (
    <Menu.Root>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <Menu.Trigger
              render={<MediaPlayerButton aria-label="Volume" />}
            >
              <VolumeIcon />
            </Menu.Trigger>
          }
        />
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8} side="top">
            <Tooltip.Popup className={styles.tooltip}>
              <span>Mute</span>
              <Kbd>M</Kbd>
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
          <Menu.Popup className={styles.volumePopup}>
            <Slider.Root
              value={isMuted ? 0 : volume * 100}
              onValueChange={(value) => {
                const v = Array.isArray(value) ? value[0] : value;
                if (v !== undefined) onVolumeChange(v / 100);
              }}
              orientation="vertical"
              aria-label="Volume"
              className={styles.volumeSlider}
            >
              <Slider.Control className={styles.volumeControl}>
                <Slider.Track className={styles.volumeTrack}>
                  <Slider.Indicator className={styles.volumeIndicator} />
                  <Slider.Thumb className={styles.volumeThumb} />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
            <MediaPlayerButton
              onClick={onMuteToggle}
              aria-label={isMuted ? "Unmute" : "Mute"}
              style={{ marginTop: 4 }}
            >
              <VolumeIcon />
            </MediaPlayerButton>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

interface PlaybackRateMenuProps {
  playbackRate: PlaybackRate;
  onPlaybackRateChange: (rate: PlaybackRate) => void;
}

const PlaybackRateMenu = ({
  playbackRate,
  onPlaybackRateChange,
}: PlaybackRateMenuProps) => (
  <Menu.Root>
    <Menu.Trigger
      render={
        <MediaPlayerButton
          aria-label="Playback speed"
          className={styles.speedButton}
        />
      }
    >
      <span className={styles.speedLabel}>{playbackRate}×</span>
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner
        className={styles.positioner}
        sideOffset={8}
        align="center"
        side="top"
      >
        <Menu.Popup className={styles.popup}>
          <Menu.Group className={styles.group}>
            <Menu.GroupLabel className={styles.label}>Speed</Menu.GroupLabel>
            <Menu.RadioGroup value={playbackRate.toString()}>
              {PLAYBACK_RATES.map((rate) => (
                <Menu.RadioItem
                  key={rate}
                  value={rate.toString()}
                  closeOnClick={false}
                  onClick={() => onPlaybackRateChange(rate)}
                  className={styles.item}
                >
                  {rate}×
                  <Menu.RadioItemIndicator
                    className={styles.check}
                    keepMounted
                    render={
                      <AnimatePresence initial={false}>
                        {playbackRate === rate && (
                          <motion.div
                            key="check"
                            initial={{ opacity: 0, scale: 0.8, filter: "blur(2px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.8, filter: "blur(2px)" }}
                            transition={{ duration: 0.18 }}
                          >
                            <CheckIcon size={16} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    }
                  />
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Group>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
);

interface SettingsMenuProps {
  autoScroll: boolean;
  canDownload: boolean;
  isLooping: boolean;
  onAutoScrollChange: (value: boolean) => void;
  onDownload: () => void;
  onLoopChange: (looping: boolean) => void;
  onCopyTimestamp: () => void;
}

const SettingsMenu = ({
  autoScroll,
  canDownload,
  isLooping,
  onAutoScrollChange,
  onDownload,
  onLoopChange,
  onCopyTimestamp,
}: SettingsMenuProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyTimestamp = React.useCallback(() => {
    onCopyTimestamp();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopyTimestamp]);

  return (
    <Menu.Root>
      <Menu.Trigger render={<MediaPlayerButton aria-label="Settings" />}>
        <GearIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className={styles.positioner}
          sideOffset={16}
          align="end"
          side="top"
        >
          <Menu.Popup className={styles.popup}>
            <Menu.CheckboxItem
              checked={autoScroll}
              onCheckedChange={onAutoScrollChange}
              className={styles.item}
            >
              Auto-scroll
              <Menu.CheckboxItemIndicator
                className={styles.check}
                keepMounted
                render={
                  <AnimatePresence initial={false}>
                    {autoScroll && (
                      <motion.div
                        key="check"
                        initial={{ opacity: 0, scale: 0.8, filter: "blur(2px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.8, filter: "blur(2px)" }}
                        transition={{ duration: 0.18 }}
                      >
                        <CheckIcon size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                }
              />
            </Menu.CheckboxItem>

            <Menu.CheckboxItem
              checked={isLooping}
              onCheckedChange={onLoopChange}
              className={styles.item}
            >
              <RepeatIcon size={16} />
              Loop
              <Menu.CheckboxItemIndicator
                className={styles.check}
                keepMounted
                render={
                  <AnimatePresence initial={false}>
                    {isLooping && (
                      <motion.div
                        key="check"
                        initial={{ opacity: 0, scale: 0.8, filter: "blur(2px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.8, filter: "blur(2px)" }}
                        transition={{ duration: 0.18 }}
                      >
                        <CheckIcon size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                }
              />
            </Menu.CheckboxItem>



            <Menu.Separator className={styles.separator} />

            <Menu.Item
              className={styles.item}
              onClick={handleCopyTimestamp}
            >
              <ShareIcon size={16} />
              {copied ? "Copied!" : "Share at Timestamp"}
            </Menu.Item>

            <Menu.Item
              className={styles.item}
              onClick={onDownload}
              disabled={!canDownload}
            >
              Download Audio
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

const MediaPlayerButton = (props: ComponentProps<typeof Button>) => (
  <Button className={styles.button} {...props} />
);

interface TooltipButtonProps extends ComponentProps<"button"> {
  label: string;
  shortcut?: string;
  children?: React.ReactNode;
}

const TooltipButton = ({
  label,
  shortcut,
  children,
  ...props
}: TooltipButtonProps) => (
  <Tooltip.Root>
    <Tooltip.Trigger render={<MediaPlayerButton {...props} />}>
      {children}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Positioner sideOffset={8} side="top">
        <Tooltip.Popup className={styles.tooltip}>
          <span>{label}</span>
          {shortcut && <Kbd>{shortcut}</Kbd>}
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>
);

const Kbd = (props: ComponentProps<"kbd">) => (
  <kbd className={styles.kbd} {...props} />
);

const Time = (props: ComponentProps<"span">) => (
  <span className={styles.time} {...props} />
);
