"use client";

import { Button } from "@base-ui-components/react/button";
import { Menu } from "@base-ui-components/react/menu";
import { Slider } from "@base-ui-components/react/slider";
import { Portal } from "@radix-ui/react-portal";
import { AnimatePresence, motion } from "motion/react";
import type { ComponentProps } from "react";
import React from "react";
import { FilledCheckIcon } from "@/components/icons/filled-check";
import { GearIcon } from "@/components/icons/gear";
import { PauseIcon } from "@/components/icons/pause";
import { PlayIcon } from "@/components/icons/play";
import { PlaylistIcon } from "@/components/icons/playlist";
import { PLAYBACK_RATES, type PlaybackRate } from "./store";
import { Orb } from "../orb";
import styles from "./styles.module.css";
import { useAudioReader } from "./use-audio-reader";
import { formatTime } from "./utils";

interface Chapter {
  id: string;
  level: number;
  text: string;
}

interface AudioReaderProps {
  slugSegments: string[];
  title: string;
  authorName: string;
}

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
    playbackRate,
    setPlaybackRate,
    autoScroll,
    setAutoScroll,
    audioUrl,
    colors,
  } = useAudioReader({ slugSegments, title, authorName });

  const readerRef = React.useRef<HTMLDivElement | null>(null);
  const [isReaderVisible, setIsReaderVisible] = React.useState(true);
  const [chapters, setChapters] = React.useState<Chapter[]>([]);

  // Collect headings from the page
  React.useEffect(() => {
    const headings = document.querySelectorAll<HTMLHeadingElement>(
      "article h1, article h2, article h3, article h4, article h5, article h6",
    );

    const collected: Chapter[] = [];
    headings.forEach((heading) => {
      const id = heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, "-") || "";
      if (!heading.id && id) {
        heading.id = id;
      }
      collected.push({
        id,
        level: parseInt(heading.tagName.charAt(1), 10),
        text: heading.textContent || "",
      });
    });

    setChapters(collected);
  }, []);

  const scrollToChapter = React.useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
      const time = (percent / 100) * duration;
      seek(time);
    },
    [duration, seek],
  );

  const IconSwitchTransition = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.18 },
  };

  React.useEffect(() => {
    const target = readerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsReaderVisible(entry?.isIntersecting ?? false),
      {
        threshold: 0.4,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

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
            <MediaPlayerButton onClick={handleToggle}>
              <AnimatePresence mode="wait">
                {isPlaying ? (
                  <motion.div {...IconSwitchTransition} key="pause">
                    <PauseIcon />
                  </motion.div>
                ) : (
                  <motion.div {...IconSwitchTransition} key="play">
                    <PlayIcon />
                  </motion.div>
                )}
              </AnimatePresence>
            </MediaPlayerButton>

            <Slider.Root
              value={progress}
              onValueChange={handleSeek}
              className={styles.slider}
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

            {/* Chapters Menu */}
            <Menu.Root>
              <Menu.Trigger render={<MediaPlayerButton />}>
                <PlaylistIcon />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner className={styles.positioner} sideOffset={8}>
                  <Menu.Popup className={styles.popup}>
                    {chapters.length > 0 ? (
                      chapters.map((chapter) => (
                        <Menu.Item
                          key={chapter.id}
                          className={styles.item}
                          style={{ paddingLeft: `${(chapter.level - 1) * 12 + 12}px` }}
                          onClick={() => scrollToChapter(chapter.id)}
                        >
                          {chapter.text}
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

            {/* Settings Menu */}
            <Menu.Root>
              <Menu.Trigger render={<MediaPlayerButton />}>
                <GearIcon />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner className={styles.positioner} sideOffset={8}>
                  <Menu.Popup className={styles.popup}>
                    <Menu.Group className={styles.group}>
                      <Menu.GroupLabel className={styles.label}>
                        Playback Speed
                      </Menu.GroupLabel>
                      <Menu.RadioGroup
                        value={String(playbackRate)}
                        onValueChange={(value) =>
                          setPlaybackRate(Number(value) as PlaybackRate)
                        }
                      >
                        {PLAYBACK_RATES.map((rate) => (
                          <Menu.RadioItem
                            key={rate}
                            value={String(rate)}
                            className={styles.item}
                          >
                            <Menu.RadioItemIndicator className={styles.indicator}>
                              <FilledCheckIcon />
                            </Menu.RadioItemIndicator>
                            {rate}x
                          </Menu.RadioItem>
                        ))}
                      </Menu.RadioGroup>
                    </Menu.Group>
                    <Menu.Separator className={styles.separator} />
                    <Menu.CheckboxItem
                      checked={autoScroll}
                      onCheckedChange={setAutoScroll}
                      className={styles.item}
                    >
                      <Menu.CheckboxItemIndicator className={styles.indicator}>
                        <FilledCheckIcon />
                      </Menu.CheckboxItemIndicator>
                      Auto-scroll
                    </Menu.CheckboxItem>
                    <Menu.Separator className={styles.separator} />
                    <Menu.Item
                      className={styles.item}
                      onClick={handleDownload}
                      disabled={!audioUrl}
                    >
                      Download audio
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </motion.div>
        )}
      </div>

      <Portal className={styles.floating}>
        <AnimatePresence mode="sync">
          {!isReaderVisible && status !== "loading" && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.4,
                ease: [0.19, 1, 0.22, 1],
              }}
              className={styles.background}
            >
              <div className={styles.blur} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="sync">
          {!isReaderVisible && status !== "loading" && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                filter: "blur(2px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                filter: "blur(2px)",
              }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className={styles.controls}
              style={{
                bottom: 48,
              }}
            >
              <MediaPlayerButton onClick={handleToggle}>
                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.div {...IconSwitchTransition} key="pause">
                      <PauseIcon />
                    </motion.div>
                  ) : (
                    <motion.div {...IconSwitchTransition} key="play">
                      <PlayIcon />
                    </motion.div>
                  )}
                </AnimatePresence>
              </MediaPlayerButton>

              <Slider.Root
                value={progress}
                onValueChange={handleSeek}
                className={styles.slider}
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

              {/* Chapters Menu */}
              <Menu.Root>
                <Menu.Trigger render={<MediaPlayerButton />}>
                  <PlaylistIcon />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner className={styles.positioner} sideOffset={8}>
                    <Menu.Popup className={styles.popup}>
                      {chapters.length > 0 ? (
                        chapters.map((chapter) => (
                          <Menu.Item
                            key={chapter.id}
                            className={styles.item}
                            style={{ paddingLeft: `${(chapter.level - 1) * 12 + 12}px` }}
                            onClick={() => scrollToChapter(chapter.id)}
                          >
                            {chapter.text}
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

              {/* Settings Menu */}
              <Menu.Root>
                <Menu.Trigger render={<MediaPlayerButton />}>
                  <GearIcon />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner className={styles.positioner} sideOffset={8}>
                    <Menu.Popup className={styles.popup}>
                      <Menu.Group className={styles.group}>
                        <Menu.GroupLabel className={styles.label}>
                          Playback Speed
                        </Menu.GroupLabel>
                        <Menu.RadioGroup
                          value={String(playbackRate)}
                          onValueChange={(value) =>
                            setPlaybackRate(Number(value) as PlaybackRate)
                          }
                        >
                          {PLAYBACK_RATES.map((rate) => (
                            <Menu.RadioItem
                              key={rate}
                              value={String(rate)}
                              className={styles.item}
                            >
                              <Menu.RadioItemIndicator className={styles.indicator}>
                                <FilledCheckIcon />
                              </Menu.RadioItemIndicator>
                              {rate}x
                            </Menu.RadioItem>
                          ))}
                        </Menu.RadioGroup>
                      </Menu.Group>
                      <Menu.Separator className={styles.separator} />
                      <Menu.CheckboxItem
                        checked={autoScroll}
                        onCheckedChange={setAutoScroll}
                        className={styles.item}
                      >
                        <Menu.CheckboxItemIndicator className={styles.indicator}>
                          <FilledCheckIcon />
                        </Menu.CheckboxItemIndicator>
                        Auto-scroll
                      </Menu.CheckboxItem>
                      <Menu.Separator className={styles.separator} />
                      <Menu.Item
                        className={styles.item}
                        onClick={handleDownload}
                        disabled={!audioUrl}
                      >
                        Download audio
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </React.Fragment>
  );
};

const MediaPlayerButton = (props: ComponentProps<typeof Button>) => {
  return <Button className={styles.button} {...props} />;
};

const Time = (props: ComponentProps<"span">) => {
  return <span className={styles.time} {...props} />;
};
