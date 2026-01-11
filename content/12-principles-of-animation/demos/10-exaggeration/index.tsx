"use client";

import { LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { HeartIcon, LightBulbIcon, StarIcon } from "@/icons";
import styles from "./styles.module.css";

const SUCCESS_DURATION = 2000;
const CORRECT_INDEX = 1;

const ICONS = [
  { Icon: HeartIcon, label: "Heart" },
  { Icon: StarIcon, label: "Star" },
  { Icon: LightBulbIcon, label: "Light Bulb" },
];

export function Exaggeration() {
  const [state, setState] = useState<"default" | "success" | "error">(
    "default",
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (state === "success") return;

    const isCorrect = index === CORRECT_INDEX;
    setSelectedIndex(index);
    setState(isCorrect ? "success" : "error");

    if (!isCorrect) {
      setTimeout(() => {
        setState("default");
        setSelectedIndex(null);
      }, SUCCESS_DURATION);
    }
  };

  const _handleReset = () => {
    setState("default");
    setSelectedIndex(null);
  };

  return (
    <LayoutGroup>
      <div className={styles.container}>
        <motion.div
          key="selection"
          className={styles.selection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className={styles.icons}>
            {ICONS.map(({ Icon, label }, index) => (
              <motion.button
                key={label}
                type="button"
                className={styles.icon}
                data-state={selectedIndex === index ? state : "default"}
                onClick={() => handleSelect(index)}
                animate={
                  selectedIndex === index && state === "error"
                    ? { x: [-16, 16, -16, 16, 0] }
                    : {}
                }
                transition={{ duration: 0.3 }}
                aria-label={label}
              >
                <Icon size={32} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </LayoutGroup>
  );
}
