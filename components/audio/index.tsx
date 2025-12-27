"use client";

import { Slider } from "@base-ui/react/slider";
import { FloatingPortal as Portal } from "@floating-ui/react";
import { Orb } from "@/components/orb";
import {
  FastForwardIcon,
  PlayIcon,
  RewindIcon,
  VoiceSettingsIcon,
  VolumeFullIcon,
} from "@/icons";
import { Button } from "../button";
import styles from "./styles.module.css";

const props = {
  icon: {
    large: {
      size: 24,
    },
    small: {
      size: 18,
    },
  },
};

function Background() {
  return (
    <div className={styles.background}>
      <div className={styles.blur} />
      <div className={styles.mask} />
    </div>
  );
}

export function Audio() {
  return (
    <Portal>
      <div className={styles.audio}>
        <Background />
        <div className={styles["audio-controls"]}>
          <div className={styles.details}>
            <div className={styles.cover}>
              <Orb className={styles.shader} />
            </div>
            <div className={styles.info}>
              <div className={styles.title}>Page Title</div>
              <div className={styles.author}>Author Name</div>
            </div>
          </div>
          <div className={styles.progress}>
            <span className={styles.time}>00:48</span>
            <Slider.Root className={styles.root}>
              <Slider.Control className={styles.control}>
                <Slider.Track className={styles.track}>
                  <Slider.Indicator className={styles.indicator} />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
            <span className={styles.time}>03:15</span>
          </div>
          <div className={styles.controls}>
            <Button variant="ghost" className={styles.button}>
              <VolumeFullIcon {...props.icon.small} />
            </Button>
            <div className={styles.options}>
              <Button variant="ghost" className={styles.button}>
                <RewindIcon {...props.icon.small} />
              </Button>
              <Button variant="ghost" className={styles.button}>
                <PlayIcon {...props.icon.large} />
              </Button>
              <Button variant="ghost" className={styles.button}>
                <FastForwardIcon {...props.icon.small} />
              </Button>
            </div>
            <Button variant="ghost" className={styles.button}>
              <VoiceSettingsIcon {...props.icon.large} />
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
