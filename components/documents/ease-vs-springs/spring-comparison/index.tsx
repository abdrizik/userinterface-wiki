"use client";

import { motion } from "motion/react";
import { useCallback, useState } from "react";
import styles from "./styles.module.css";

const SPRINGS = [
  {
    name: "Stiff",
    config: { stiffness: 400, damping: 30, mass: 1 },
  },
  {
    name: "Smooth",
    config: { stiffness: 200, damping: 20, mass: 1 },
  },
  {
    name: "Bouncy",
    config: { stiffness: 300, damping: 10, mass: 1 },
  },
  {
    name: "Heavy",
    config: { stiffness: 200, damping: 30, mass: 3 },
  },
];

export function SpringComparison() {
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
        {SPRINGS.map((spring) => (
          <div key={spring.name} className={styles.row}>
            <span className={styles.label}>{spring.name}</span>
            <div className={styles.track}>
              <motion.div
                className={styles.dot}
                animate={{
                  x: isAnimating ? "calc(100% - 12px)" : 0,
                }}
                transition={{
                  type: "spring",
                  ...spring.config,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        {SPRINGS.map((spring) => (
          <div key={spring.name} className={styles.config}>
            <span className={styles.name}>{spring.name}</span>
            <span className={styles.values}>
              s:{spring.config.stiffness} d:{spring.config.damping} m:
              {spring.config.mass}
            </span>
          </div>
        ))}
      </div>
      <button type="button" className={styles.button} onClick={handlePlay}>
        Play
      </button>
    </div>
  );
}
