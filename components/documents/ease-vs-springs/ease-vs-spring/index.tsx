"use client";

import { motion } from "motion/react";
import { useCallback, useState } from "react";
import styles from "./styles.module.css";

export function EaseVsSpring() {
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
        <div className={styles.row}>
          <span className={styles.label}>Ease</span>
          <div className={styles.track}>
            <motion.div
              className={styles.dot}
              data-type="ease"
              animate={{
                x: isAnimating ? "calc(100% - 12px)" : 0,
              }}
              transition={{
                duration: 0.5,
                ease: [0.19, 1, 0.22, 1],
              }}
            />
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Spring</span>
          <div className={styles.track}>
            <motion.div
              className={styles.dot}
              data-type="spring"
              animate={{
                x: isAnimating ? "calc(100% - 12px)" : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 1,
              }}
            />
          </div>
        </div>
      </div>
      <p className={styles.hint}>
        Notice how the spring settles naturally while the ease curve has a fixed
        duration.
      </p>
      <button type="button" className={styles.button} onClick={handlePlay}>
        Play
      </button>
    </div>
  );
}
