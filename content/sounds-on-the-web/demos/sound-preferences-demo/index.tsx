"use client";

import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import styles from "./styles.module.css";

type SoundSetting = "on" | "reduced" | "off";

// Web Audio API based sound generation
function createClickSound(audioContext: AudioContext, volume: number) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    400,
    audioContext.currentTime + 0.05,
  );

  gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.1,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

const SOUND_OPTIONS: {
  id: SoundSetting;
  label: string;
  description: string;
}[] = [
  {
    id: "on",
    label: "On",
    description: "Full audio feedback for all interactions",
  },
  {
    id: "reduced",
    label: "Reduced",
    description: "Sounds only for important actions",
  },
  {
    id: "off",
    label: "Off",
    description: "No audio feedback",
  },
];

export function SoundPreferencesDemo() {
  const [soundSetting, setSoundSetting] = useState<SoundSetting>("on");
  const [volume, setVolume] = useState(0.5);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playTestSound = useCallback(() => {
    if (soundSetting === "off") return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      createClickSound(ctx, volume);
    } catch {
      // Audio not supported
    }
  }, [soundSetting, volume]);

  const handleSettingChange = (setting: SoundSetting) => {
    setSoundSetting(setting);
    if (setting !== "off") {
      setTimeout(() => {
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }
          const ctx = audioContextRef.current;
          if (ctx.state === "suspended") {
            ctx.resume();
          }
          createClickSound(ctx, setting === "reduced" ? volume * 0.5 : volume);
        } catch {
          // Audio not supported
        }
      }, 50);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.settings}>
        <div className={styles.section}>
          <span className={styles.sectionlabel}>Sound Feedback</span>
          <div className={styles.options}>
            {SOUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.option}
                data-selected={soundSetting === option.id}
                onClick={() => handleSettingChange(option.id)}
                aria-pressed={soundSetting === option.id}
              >
                <span className={styles.optionlabel}>{option.label}</span>
                <span className={styles.optiondesc}>{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section} data-disabled={soundSetting === "off"}>
          <div className={styles.sectionheader}>
            <span className={styles.sectionlabel}>Volume</span>
            <span className={styles.volumevalue}>
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            disabled={soundSetting === "off"}
          />
        </div>
      </div>

      <motion.button
        className={styles.testbutton}
        onClick={playTestSound}
        disabled={soundSetting === "off"}
        whileHover={{ scale: 0.98 }}
        whileTap={{ scale: 0.95 }}
      >
        Test Sound
      </motion.button>

      <div className={styles.code}>
        <code className={styles.snippet}>
          {`// Respect user preferences
function playSound(name: string) {
  const setting = getUserSoundSetting();
  
  if (setting === "off") return;
  if (setting === "reduced" && !isImportantAction) return;
  
  const sound = sounds[name];
  sound.volume = getUserVolume();
  sound.play();
}`}
        </code>
      </div>
    </div>
  );
}
