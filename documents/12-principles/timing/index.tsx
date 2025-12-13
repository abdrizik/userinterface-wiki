"use client";

import { Popover } from "@base-ui-components/react/popover";
import { motion } from "motion/react";
import { useState } from "react";
import { AphexTwinIcon } from "@/components/icons";
import styles from "./styles.module.css";

enum AnimationState {
  Sluggish = "sluggish",
  Snappy = "snappy",
}

export function Timing() {
  const [state, setState] = useState<AnimationState>(AnimationState.Snappy);

  const Trigger = motion.create(Popover.Trigger);

  const handleAnimationStateChange = () => {
    setState((prev) =>
      prev === AnimationState.Snappy
        ? AnimationState.Sluggish
        : AnimationState.Snappy,
    );
  };

  return (
    <div className={styles.container}>
      <Popover.Root openOnHover>
        <Trigger
          data-vinyl
          className={styles.trigger}
          whileHover={{ opacity: 0.9, filter: "brightness(0.9)" }}
        >
          <div className={styles.shine} />
          <div className={styles.album}>
            <AphexTwinIcon className={styles.icon} width={32} height={32} />
          </div>
        </Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={16} side="top">
            <Popover.Popup
              className={styles.popup}
              data-animation-state={state}
            >
              <Popover.Title className={styles.title}>
                Selected Ambient Works 85-92
              </Popover.Title>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      <button
        onClick={handleAnimationStateChange}
        className={styles.button}
        type="button"
      >
        {state === AnimationState.Snappy
          ? "Snappy (120ms)"
          : "Sluggish (800ms)"}
      </button>
    </div>
  );
}
