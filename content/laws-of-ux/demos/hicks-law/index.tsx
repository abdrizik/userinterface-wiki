"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/sounds";
import styles from "./styles.module.css";

const COLOR_WORDS = [
  { word: "Red", hex: "#e5484d" },
  { word: "Blue", hex: "#3e63dd" },
  { word: "Green", hex: "#30a46c" },
  { word: "Orange", hex: "#f76b15" },
  { word: "Purple", hex: "#8e4ec6" },
  { word: "Pink", hex: "#d6409f" },
  { word: "Cyan", hex: "#0894b3" },
  { word: "Teal", hex: "#0d9488" },
  { word: "Violet", hex: "#6e56cf" },
  { word: "Brown", hex: "#886349" },
  { word: "Gold", hex: "#ad6800" },
  { word: "Plum", hex: "#ab4aba" },
  { word: "Crimson", hex: "#ca244d" },
  { word: "Navy", hex: "#2b4a8e" },
  { word: "Olive", hex: "#5c7c2f" },
  { word: "Maroon", hex: "#8c333a" },
  { word: "Amber", hex: "#c27800" },
  { word: "Coral", hex: "#e54666" },
  { word: "Mint", hex: "#147d6f" },
  { word: "Slate", hex: "#4a5e75" },
  { word: "Ruby", hex: "#c4295b" },
  { word: "Cobalt", hex: "#2952cc" },
  { word: "Sage", hex: "#4b6058" },
  { word: "Indigo", hex: "#3a4ec6" },
];

const ROUNDS = [4, 8, 16, 24] as const;

type Phase = "idle" | "searching" | "found" | "results";

interface Tile {
  word: string;
  displayHex: string;
  x: number;
  y: number;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildPool(count: number): Tile[] {
  const picked = shuffle(COLOR_WORDS).slice(0, count);
  const hexes = picked.map((c) => c.hex);
  const offset = 1 + Math.floor(Math.random() * (count - 1));

  const tiles: Tile[] = [];
  for (let i = 0; i < picked.length; i++) {
    let x: number;
    let y: number;
    let attempts = 0;
    do {
      x = 8 + Math.random() * 84;
      y = 8 + Math.random() * 74;
      attempts++;
    } while (
      attempts < 80 &&
      tiles.some((t) => Math.hypot(x - t.x, y - t.y) < 12)
    );
    tiles.push({
      word: picked[i].word,
      displayHex: hexes[(i + offset) % count],
      x,
      y,
    });
  }
  return tiles;
}

export function HicksLaw() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [roundIndex, setRoundIndex] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [pool, setPool] = useState<Tile[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [shaking, setShaking] = useState<string | null>(null);
  const [foundWord, setFoundWord] = useState<string | null>(null);
  const [results, setResults] = useState<number[]>([]);
  const currentMisses = useRef(0);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const startRound = useCallback(
    (index: number) => {
      stopTimer();
      setRoundIndex(index);
      const count = ROUNDS[index];
      const tiles = buildPool(count);
      const pick = tiles[Math.floor(Math.random() * tiles.length)];
      setPool(tiles);
      setTarget(pick.word);
      setElapsed(0);
      setShaking(null);
      setFoundWord(null);
      currentMisses.current = 0;
      setPhase("searching");
      sounds.whoosh();
      startRef.current = performance.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.round(performance.now() - startRef.current));
      }, 16);
    },
    [stopTimer],
  );

  useEffect(() => {
    if (phase !== "found") return;
    const next = roundIndex + 1;
    const id = setTimeout(() => {
      if (next < ROUNDS.length) {
        startRound(next);
      } else {
        sounds.success();
        setPhase("results");
      }
    }, 1500);
    return () => clearTimeout(id);
  }, [phase, roundIndex, startRound]);

  const handlePick = useCallback(
    (word: string) => {
      if (phase !== "searching") return;
      if (word === target) {
        stopTimer();
        const ms = Math.round(performance.now() - startRef.current);
        setElapsed(ms);
        setFoundWord(word);
        sounds.pop();
        setTimeout(() => {
          setResults((prev) => [...prev, ms]);
          setPhase("found");
        }, 300);
      } else {
        currentMisses.current += 1;
        setShaking(word);
        sounds.error();
        setTimeout(() => setShaking(null), 500);
      }
    },
    [phase, target, stopTimer],
  );

  const handleStart = useCallback(() => {
    setResults([]);
    sounds.click();
    startRound(0);
  }, [startRound]);

  const handleReset = useCallback(() => {
    stopTimer();
    sounds.click();
    setPhase("idle");
    setResults([]);
    setRoundIndex(0);
    setPool([]);
    setTarget(null);
    setElapsed(0);
    setFoundWord(null);
  }, [stopTimer]);

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

        {phase === "searching" && (
          <motion.div
            key={`search-${roundIndex}`}
            className={styles.field}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {pool.map((tile, i) => (
              <motion.button
                key={tile.word}
                type="button"
                className={styles.tile}
                style={{
                  color:
                    foundWord === tile.word
                      ? "var(--green-11)"
                      : tile.displayHex,
                  left: `${tile.x}%`,
                  top: `${tile.y}%`,
                }}
                data-wrong={shaking === tile.word}
                data-found={foundWord === tile.word}
                onClick={() => handlePick(tile.word)}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: i * 0.012,
                }}
                whileHover={!foundWord ? { scale: 1.08 } : {}}
                whileTap={!foundWord ? { scale: 0.92 } : {}}
                aria-label={`Word ${tile.word}`}
              >
                {tile.word}
              </motion.button>
            ))}
            <div className={styles.prompt}>
              <span className={styles["prompt-label"]}>Find</span>
              <span className={styles["prompt-word"]}>{target}</span>
              <span className={styles.timer}>{elapsed}ms</span>
              {currentMisses.current > 0 && (
                <span className={styles["miss-count"]}>
                  {currentMisses.current}x
                </span>
              )}
            </div>
          </motion.div>
        )}

        {phase === "found" && (
          <motion.div
            key={`found-${roundIndex}`}
            className={styles.center}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <span className={styles["found-progress"]}>
              {roundIndex + 1} / {ROUNDS.length}
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
              {ROUNDS.map((count, i) => (
                <motion.div
                  key={count}
                  className={styles.row}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.06 }}
                >
                  <span className={styles.label}>{count} options</span>
                  <span className={styles.value}>{results[i]}ms</span>
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
