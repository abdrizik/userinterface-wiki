"use client";

import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import styles from "./styles.module.css";

// Web Audio API based sound generation for demo purposes
function createClickSound(audioContext: AudioContext) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    400,
    audioContext.currentTime + 0.05,
  );

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.1,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

export function ButtonSoundDemo() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [clickCount, setClickCount] = useState({ silent: 0, sound: 0 });
  const audioContextRef = useRef<AudioContext | null>(null);

  const playClick = useCallback(() => {
    if (!soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      createClickSound(ctx);
    } catch {
      // Audio not supported, fail silently
    }
  }, [soundEnabled]);

  const handleSilentClick = () => {
    setClickCount((prev) => ({ ...prev, silent: prev.silent + 1 }));
  };

  const handleSoundClick = () => {
    playClick();
    setClickCount((prev) => ({ ...prev, sound: prev.sound + 1 }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.toggle}>
        <span className={styles.label}>Sound</span>
        <button
          type="button"
          className={styles.switch}
          data-checked={soundEnabled}
          onClick={() => setSoundEnabled(!soundEnabled)}
          aria-pressed={soundEnabled}
        >
          <span className={styles.thumb} />
        </button>
      </div>

      <div className={styles.comparison}>
        <div className={styles.column}>
          <span className={styles.columnlabel}>Without Sound</span>
          <motion.button
            className={styles.button}
            data-variant="silent"
            onClick={handleSilentClick}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
          >
            Click Me
          </motion.button>
          <span className={styles.count}>{clickCount.silent} clicks</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.column}>
          <span className={styles.columnlabel}>With Sound</span>
          <motion.button
            className={styles.button}
            data-variant="sound"
            onClick={handleSoundClick}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
          >
            Click Me
          </motion.button>
          <span className={styles.count}>{clickCount.sound} clicks</span>
        </div>
      </div>

      <p className={styles.hint}>
        Notice how the button with sound feels more responsive and satisfying.
      </p>
    </div>
  );
}
