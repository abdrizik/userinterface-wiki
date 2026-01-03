"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import styles from "./styles.module.css";

const BACKDROP_STYLES = [
  { id: "blur", label: "Blur", value: "blur" },
  { id: "dark", label: "Dark", value: "dark" },
  { id: "gradient", label: "Gradient", value: "gradient" },
  { id: "noise", label: "Noise", value: "noise" },
] as const;

type BackdropStyle = (typeof BACKDROP_STYLES)[number]["value"];

export function BackdropDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [backdropStyle, setBackdropStyle] = useState<BackdropStyle>("blur");

  return (
    <div className={styles.container}>
      <div className={styles.picker}>
        {BACKDROP_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            className={styles.option}
            data-selected={backdropStyle === style.value}
            onClick={() => setBackdropStyle(style.value)}
            aria-pressed={backdropStyle === style.value}
          >
            {style.label}
          </button>
        ))}
      </div>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger
          render={
            <motion.button
              className={styles.trigger}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
            >
              Open Dialog
            </motion.button>
          }
        />

        <Dialog.Portal keepMounted>
          <Dialog.Backdrop
            className={styles.backdrop}
            data-style={backdropStyle}
          />

          <AnimatePresence>
            {isOpen && (
              <Dialog.Popup
                render={
                  <motion.div
                    className={styles.popup}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  >
                    <Dialog.Title className={styles.title}>
                      ::backdrop in action
                    </Dialog.Title>
                    <Dialog.Description className={styles.description}>
                      The backdrop is styled using the <code>::backdrop</code>{" "}
                      pseudo-element. Try different styles to see how it affects
                      the overlay.
                    </Dialog.Description>
                    <Dialog.Close
                      render={
                        <motion.button
                          className={styles.close}
                          whileHover={{ scale: 0.98 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Close
                        </motion.button>
                      }
                    />
                  </motion.div>
                }
              />
            )}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
