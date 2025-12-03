"use client";

import { Button } from "@base-ui-components/react/button";
import { Slider } from "@base-ui-components/react/slider";
import { AnimatePresence, motion } from "motion/react";
import type { ComponentProps } from "react";
import { PauseIcon } from "@/components/icons/pause";
import { PlayIcon } from "@/components/icons/play";
import { ExpandIcon } from "../icons/expand";
import { PictureInPictureIcon } from "../icons/picture-in-picture";
import { Orb } from "../orb";
import styles from "./styles.module.css";
import { useAudioReader } from "./use-audio-reader";
import { formatTime } from "./utils";

interface AudioReaderProps {
  slugSegments: string[];
}

export const AudioReader = ({ slugSegments }: AudioReaderProps) => {
  const { status, isPlaying, duration, currentTime, agentState, handleToggle } =
    useAudioReader(slugSegments);

  const progress =
    duration > 0
      ? Math.min(Math.max((currentTime / duration) * 100, 0), 100)
      : 0;

  const IconSwitchTransition = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.18 },
  };

  return (
    <div className={styles.reader}>
      <Orb agentState={agentState} className={styles.orb} />
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

          <MediaPlayerButton>1x</MediaPlayerButton>

          <Slider.Root value={progress} className={styles.slider}>
            <Time>{formatTime(currentTime)}</Time>
            <Slider.Control className={styles.control}>
              <Slider.Track className={styles.track}>
                <Slider.Indicator className={styles.indicator} />
                <Slider.Thumb className={styles.thumb} />
              </Slider.Track>
            </Slider.Control>
            <Time>{formatTime(duration)}</Time>
          </Slider.Root>

          <MediaPlayerButton>
            <PictureInPictureIcon />
          </MediaPlayerButton>

          <MediaPlayerButton>
            <ExpandIcon />
          </MediaPlayerButton>
        </motion.div>
      )}
    </div>
  );
};

const MediaPlayerButton = (props: ComponentProps<typeof Button>) => {
  return <Button className={styles.button} {...props} />;
};

const Time = (props: ComponentProps<"span">) => {
  return <span className={styles.time} {...props} />;
};
