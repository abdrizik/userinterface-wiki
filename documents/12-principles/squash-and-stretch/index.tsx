"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Crown, Fire, Toast } from "@/components/icons";
import styles from "./styles.module.css";

const icons = {
  fire: Fire,
  crown: Crown,
  toast: Toast,
};

export function SquashStretch() {
  const [icon, setIcon] = useState<keyof typeof icons>("fire");

  const MotionIcon = motion.create(icons[icon]);

  return (
    <div className={styles.container}>
      <div className={styles.visual}>
        <MotionIcon
          key={icon}
          initial={{
            scaleX: 1,
            scaleY: 1,
          }}
          animate={{
            scaleX: [1.3, 1],
            scaleY: [0.8, 1],
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 110,
            damping: 2,
            mass: 0.1,
          }}
          style={{
            transformOrigin: "center center",
          }}
          className={styles.icon}
          color="var(--white)"
        />
      </div>
      <div className={styles.picker}>
        <svg
          className={styles.arrow}
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
        >
          <title>Arrow</title>
          <path
            d="M4.31851 15.6642C3.32312 17.6558 4.77047 20 6.99765 20H17.0019C19.2291 20 20.6764 17.6558 19.6811 15.6642L14.6789 5.65629C13.5751 3.4479 10.4244 3.4479 9.32065 5.65629L4.31851 15.6642Z"
            fill="oklch(0.12 0 0)"
          />
        </svg>
        {Object.keys(icons).map((iconKey) => {
          const key = iconKey as keyof typeof icons;
          const Icon = icons[key];
          return (
            <button
              key={key}
              className={styles.option}
              onClick={() => setIcon(key)}
              type="button"
              data-active={icon === key ? "true" : "false"}
            >
              <Icon
                className={styles.icon}
                color={"var(--white)"}
                opacity={icon === key ? 1 : 0.5}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
