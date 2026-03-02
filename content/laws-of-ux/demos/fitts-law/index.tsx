"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { sounds } from "@/lib/sounds";
import styles from "./styles.module.css";

const SIZES = [
  { label: "Small", diameter: 10 },
  { label: "Medium", diameter: 40 },
  { label: "Large", diameter: 96 },
];

const REPS = 4;

interface Round {
  label: string;
  diameter: number;
  x: number;
  y: number;
}

type Phase = "idle" | "playing" | "results";

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateRounds(): Round[] {
  const pool = SIZES.flatMap((size) =>
    Array.from({ length: REPS }, () => ({
      label: size.label,
      diameter: size.diameter,
    })),
  );
  const shuffled = shuffle(pool);
  const rounds: Round[] = [];

  for (const item of shuffled) {
    let x: number;
    let y: number;
    let attempts = 0;
    do {
      x = 15 + Math.random() * 70;
      y = 15 + Math.random() * 70;
      attempts++;
    } while (
      rounds.length > 0 &&
      attempts < 50 &&
      Math.hypot(
        x - rounds[rounds.length - 1].x,
        y - rounds[rounds.length - 1].y,
      ) < 25
    );
    rounds.push({ ...item, x, y });
  }

  return rounds;
}

export function FittsLaw() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const startRef = useRef(0);

  const handleStart = useCallback(() => {
    const newRounds = generateRounds();
    setRounds(newRounds);
    setRoundIndex(0);
    setResults([]);
    setPhase("playing");
    sounds.click();
    startRef.current = performance.now();
  }, []);

  const handleTargetClick = useCallback(() => {
    if (phase !== "playing") return;
    const ms = Math.round(performance.now() - startRef.current);
    sounds.pop();
    setResults((prev) => [...prev, ms]);

    const next = roundIndex + 1;
    if (next < rounds.length) {
      setRoundIndex(next);
      startRef.current = performance.now();
    } else {
      sounds.success();
      setPhase("results");
    }
  }, [phase, roundIndex, rounds.length]);

  const handleReset = useCallback(() => {
    sounds.click();
    setPhase("idle");
    setResults([]);
    setRounds([]);
    setRoundIndex(0);
  }, []);

  const current = rounds[roundIndex];

  const chartData = SIZES.map((size) => {
    const times = rounds
      .map((r, i) => (r.label === size.label ? results[i] : null))
      .filter((t): t is number => t != null);
    const avg =
      times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0;
    return { label: size.label, avg };
  });

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="idle"
            className={styles.center}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              className={styles.start}
              onClick={handleStart}
            >
              Start
            </button>
          </motion.div>
        )}

        {phase === "playing" && current && (
          <motion.div
            key="playing"
            className={styles.field}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <AnimatePresence mode="wait">
              <motion.button
                key={roundIndex}
                type="button"
                className={styles.target}
                style={{
                  width: current.diameter,
                  height: current.diameter,
                  left: `${current.x}%`,
                  top: `${current.y}%`,
                }}
                onClick={handleTargetClick}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              />
            </AnimatePresence>
            <span className={styles.info}>
              {roundIndex + 1} / {rounds.length}
            </span>
          </motion.div>
        )}

        {phase === "results" && (
          <motion.div
            key="results"
            className={styles["results-panel"]}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.table}>
              {chartData.map((entry, i) => (
                <motion.div
                  key={entry.label}
                  className={styles.row}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.06 }}
                >
                  <span className={styles.label}>{entry.label}</span>
                  <span className={styles.value}>{entry.avg}ms</span>
                </motion.div>
              ))}
            </div>
            <button
              type="button"
              className={styles.again}
              onClick={handleReset}
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
