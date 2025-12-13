"use client";

import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import styles from "./styles.module.css";

const SUCCESS_DURATION = 2000;
const ERROR_DURATION = 1000;
const HINT_DELAY = 1000;

export function Exaggeration() {
  const [inputState, setInputState] = useState<"default" | "success" | "error">(
    "default",
  );
  const [value, setValue] = useState("");
  const [inputRef, animate] = useAnimate();
  const [hint, setHint] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isInSuccessState = inputState === "success";

  const handleInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isInSuccessState) return;

    const inputValue = inputRef.current?.value.toLowerCase().trim();

    if (inputValue === "pear") {
      setInputState("success");
      setHint(false);

      animate(
        inputRef.current,
        {},
        {
          type: "spring",
          stiffness: 110,
          damping: 2,
          mass: 0.1,
        },
      );

      timeoutRef.current = setTimeout(() => {
        setInputState("default");
        setValue("");
        timeoutRef.current = null;
      }, SUCCESS_DURATION);
    } else {
      setInputState("error");

      animate(
        inputRef.current,
        { x: [-24, 24, -24, 24, 0] },
        { duration: 0.3 },
      );

      const _hintTimeout = setTimeout(() => {
        setHint(true);
      }, HINT_DELAY);

      timeoutRef.current = setTimeout(() => {
        setInputState("default");

        timeoutRef.current = null;
      }, ERROR_DURATION);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isInSuccessState) return;

    if (hint) {
      setHint(false);
    }

    setValue(e.target.value);
  };

  const getInputClassName = () => {
    const baseClass = styles.input;
    if (inputState === "success") return `${baseClass} ${styles.success}`;
    if (inputState === "error") return `${baseClass} ${styles.error}`;
    return baseClass;
  };

  const [ref, bounds] = useMeasure();

  return (
    <motion.div
      initial={false}
      animate={{
        height: bounds.height > 10 ? bounds.height : "auto",
      }}
      transition={{
        duration: 0.4,
        ease: [0.25, 1, 0.5, 1],
        delay: 0.01,
      }}
    >
      <div
        ref={ref}
        style={{
          whiteSpace: "nowrap",
          width: "fit-content",
          position: "relative",
          padding: "0 12px",
        }}
      >
        <motion.div className={styles.container}>
          <form onSubmit={handleInputSubmit} className={styles.form}>
            <motion.input
              ref={inputRef}
              className={getInputClassName()}
              placeholder="Favourite Fruit..."
              maxLength={24}
              value={value}
              onChange={handleInputChange}
              readOnly={isInSuccessState}
            />
          </form>
          <AnimatePresence mode="popLayout">
            {hint && (
              <motion.p
                initial={{
                  opacity: 0,
                  filter: "blur(4px)",
                }}
                animate={{
                  opacity: 1,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  filter: "blur(4px)",
                }}
                transition={{
                  ease: [0.19, 1, 0.22, 1],
                  duration: 0.4,
                }}
                className={styles.hint}
              >
                Try Pear.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
