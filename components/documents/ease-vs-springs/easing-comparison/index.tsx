"use client";

import { motion } from "motion/react";
import { useCallback, useState } from "react";
import styles from "./styles.module.css";

const EASINGS = [
  {
    name: "Linear",
    value: [0, 0, 1, 1] as [number, number, number, number],
  },
  {
    name: "Ease Out",
    value: [0.19, 1, 0.22, 1] as [number, number, number, number],
  },
  {
    name: "Ease In",
    value: [0.755, 0.05, 0.855, 0.06] as [number, number, number, number],
  },
  {
    name: "Ease In Out",
    value: [0.455, 0.03, 0.515, 0.955] as [number, number, number, number],
  },
];

export function EasingComparison() {
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePlay = useCallback(() => {
    setIsAnimating(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.tracks}>
        {EASINGS.map((easing) => (
          <div key={easing.name} className={styles.row}>
            <span className={styles.label}>{easing.name}</span>
            <div className={styles.track}>
              <motion.div
                className={styles.dot}
                animate={{
                  x: isAnimating ? "calc(100% - 12px)" : 0,
                }}
                transition={{
                  duration: 0.8,
                  ease: easing.value,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <button type="button" className={styles.button} onClick={handlePlay}>
        Play
      </button>
    </div>
  );
}
