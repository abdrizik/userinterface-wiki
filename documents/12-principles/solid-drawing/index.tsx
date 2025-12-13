"use client";

import { motion } from "motion/react";
import { useCallback, useState } from "react";
import styles from "./styles.module.css";

const inOutCubic: [number, number, number, number] = [0.645, 0.045, 0.355, 1];

const ORBIT_DURATION = 2.5;

export function SolidDrawing() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);

  const toggleAnimation = useCallback(() => {
    setIsPlaying((prev) => !prev);
    if (!isPlaying) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [isPlaying]);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <motion.svg
          key={`svg-${animationKey}`}
          viewBox="0 0 128 128"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.globe}
        >
          <title>Globe</title>

          <motion.circle cx="64" cy="64" r="36" fill="var(--background)" />
          <motion.circle
            cx="64"
            cy="64"
            r="26"
            fill="var(--background)"
            stroke="var(--orange-ring)"
            strokeWidth="6"
            initial={{
              strokeDasharray: "2 4.09",
            }}
            animate={{
              rotate: isPlaying ? [0, 360] : 0,
              strokeDasharray: !isPlaying ? "2 0" : "2 4.09",
              transition: {
                rotate: {
                  repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
                  ease: "linear",
                  duration: 2,
                },
                strokeDasharray: {
                  duration: 0.7,
                  ease: inOutCubic,
                },
              },
            }}
          />
          <motion.circle
            cx="64"
            cy="64"
            r="16"
            fill="var(--orange)"
            initial={{
              scale: 0,
              fill: "var(--background)",
            }}
            animate={{
              scale: !isPlaying ? 1 : 0,
              fill: !isPlaying ? "var(--orange)" : "var(--background)",
            }}
            transition={{
              duration: 0.4,
              ease: inOutCubic,
            }}
          />
        </motion.svg>

        <motion.div
          key={`orbit-${animationKey}`}
          initial={{
            transform:
              "translate(-50%, -50%) rotateY(20deg) translateZ(48px) rotateY(340deg)",
          }}
          animate={
            !isPlaying
              ? {
                  transform:
                    "translate(-50%, -50%) rotateY(20deg) translateZ(48px) rotateY(340deg)",
                  transition: { ease: [0.19, 1, 0.22, 1], duration: 3 },
                }
              : {
                  transform: [
                    "translate(-50%, -50%) rotateY(360deg) translateZ(48px) rotateY(0deg)",
                    "translate(-50%, -50%) rotateY(0deg) translateZ(48px) rotateY(360deg)",
                  ],
                  transition: {
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                    duration: ORBIT_DURATION,
                  },
                }
          }
          className={styles.orbit}
          data-loaded={!isPlaying}
        >
          <div className={styles.bg} />
          <motion.div
            animate={{
              background: !isPlaying ? "var(--purple)" : "var(--orange)",
            }}
            transformTemplate={() => "translate(-50%, -50%) "}
            className={styles.mg}
          />
          <motion.div
            animate={{
              width: !isPlaying ? 0 : 8,
              height: !isPlaying ? 0 : 8,
            }}
            transformTemplate={() => "translate(-50%, -50%)"}
            className={styles.fg}
            transition={{
              duration: 0.4,
              ease: inOutCubic,
            }}
          />
        </motion.div>
      </div>

      <button onClick={toggleAnimation} className={styles.button} type="button">
        {isPlaying ? "Pause" : "Play"}
      </button>
    </div>
  );
}
