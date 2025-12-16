"use client";

import { Button } from "@base-ui-components/react/button";
import { Menu } from "@base-ui-components/react/menu";
import { Slider } from "@base-ui-components/react/slider";
import { Portal } from "@radix-ui/react-portal";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import type { ComponentProps } from "react";
import React from "react";
import {
  CheckIcon,
  GearIcon,
  PauseIcon,
  PlayIcon,
  PlaylistIcon,
} from "@/components/icons";
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
    autoScroll,
    setAutoScroll,
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
    onToggle: handleToggle,
    onSeek: handleSeek,
    onChapterClick: scrollToChapter,
    onAutoScrollChange: setAutoScroll,
    onDownload: handleDownload,
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
  showChapters?: boolean;
  onToggle: () => void;
  onSeek: (value: number | number[]) => void;
  onChapterClick: (id: string) => void;
  onAutoScrollChange: (value: boolean) => void;
  onDownload: () => void;
}

const Controls = ({
  isPlaying,
  currentTime,
  duration,
  progress,
  chapters,
  autoScroll,
  audioUrl,
  showChapters = true,
  onToggle,
  onSeek,
  onChapterClick,
  onAutoScrollChange,
  onDownload,
}: ControlsProps) => (
  <React.Fragment>
    <MediaPlayerButton onClick={onToggle}>
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
    </MediaPlayerButton>

    {showChapters && (
      <ChaptersMenu chapters={chapters} onChapterClick={onChapterClick} />
    )}

    <Slider.Root
      value={progress}
      onValueChange={onSeek}
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

    <SettingsMenu
      autoScroll={autoScroll}
      canDownload={!!audioUrl}
      onAutoScrollChange={onAutoScrollChange}
      onDownload={onDownload}
    />
  </React.Fragment>
);

interface ChaptersMenuProps {
  chapters: Chapter[];
  onChapterClick: (id: string) => void;
}

const ChaptersMenu = ({ chapters, onChapterClick }: ChaptersMenuProps) => (
  <Menu.Root>
    <Menu.Trigger render={<MediaPlayerButton />}>
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

interface SettingsMenuProps {
  autoScroll: boolean;
  canDownload: boolean;
  onAutoScrollChange: (value: boolean) => void;
  onDownload: () => void;
}

const SettingsMenu = ({
  autoScroll,
  canDownload,
  onAutoScrollChange,
  onDownload,
}: SettingsMenuProps) => (
  <Menu.Root>
    <Menu.Trigger render={<MediaPlayerButton />}>
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
            Automatic Scrolling
            <Menu.CheckboxItemIndicator
              className={styles.indicator}
              render={<CheckIcon size={16} />}
            />
          </Menu.CheckboxItem>
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

const MediaPlayerButton = (props: ComponentProps<typeof Button>) => (
  <Button className={styles.button} {...props} />
);

const Time = (props: ComponentProps<"span">) => (
  <span className={styles.time} {...props} />
);
