"use client";

import { Portal } from "@radix-ui/react-portal";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { Orb } from "../orb";
import { Controls } from "./components/controls";
import { usePlayback } from "./playback.hook";
import type { Chapter, PlaybackProps } from "./playback.types";
import styles from "./styles/layout.module.css";

export const Playback = ({
  slugSegments,
  title,
  authorName,
}: PlaybackProps) => {
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
  } = usePlayback({ slugSegments, title, authorName });

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
