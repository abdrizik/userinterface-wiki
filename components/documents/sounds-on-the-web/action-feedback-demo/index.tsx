"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import styles from "./styles.module.css";

type ActionType = "success" | "error" | "warning" | null;

interface Feedback {
  type: ActionType;
  message: string;
}

// Web Audio API based sound generation
function createTone(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + duration,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playSuccessSound(ctx: AudioContext) {
  // Rising two-tone for success
  createTone(ctx, 523.25, 0.1); // C5
  setTimeout(() => createTone(ctx, 659.25, 0.15), 80); // E5
}

function playErrorSound(ctx: AudioContext) {
  // Descending tone for error
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(280, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.2);

  gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
}

function playWarningSound(ctx: AudioContext) {
  // Two quick beeps for warning
  createTone(ctx, 440, 0.08, "square"); // A4
  setTimeout(() => createTone(ctx, 440, 0.08, "square"), 120);
}

export function ActionFeedbackDemo() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState<ActionType>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }, []);

  const showFeedback = useCallback((type: ActionType, message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 2500);
  }, []);

  const handleSuccess = async () => {
    setIsLoading("success");
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(null);

    try {
      playSuccessSound(getAudioContext());
    } catch {
      // Audio not supported
    }
    showFeedback("success", "Payment processed successfully");
  };

  const handleError = async () => {
    setIsLoading("error");
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(null);

    try {
      playErrorSound(getAudioContext());
    } catch {
      // Audio not supported
    }
    showFeedback("error", "Card declined. Please try again.");
  };

  const handleWarning = async () => {
    setIsLoading("warning");
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(null);

    try {
      playWarningSound(getAudioContext());
    } catch {
      // Audio not supported
    }
    showFeedback("warning", "Your session will expire soon");
  };

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <motion.button
          className={styles.button}
          data-variant="success"
          onClick={handleSuccess}
          disabled={isLoading !== null}
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading === "success" ? (
            <span className={styles.spinner} />
          ) : (
            "Process Payment"
          )}
        </motion.button>

        <motion.button
          className={styles.button}
          data-variant="error"
          onClick={handleError}
          disabled={isLoading !== null}
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading === "error" ? (
            <span className={styles.spinner} />
          ) : (
            "Trigger Error"
          )}
        </motion.button>

        <motion.button
          className={styles.button}
          data-variant="warning"
          onClick={handleWarning}
          disabled={isLoading !== null}
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading === "warning" ? (
            <span className={styles.spinner} />
          ) : (
            "Show Warning"
          )}
        </motion.button>
      </div>

      <div className={styles.feedbackarea}>
        <AnimatePresence mode="wait">
          {feedback && (
            <motion.div
              key={feedback.type}
              className={styles.feedback}
              data-type={feedback.type}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            >
              <span className={styles.icon} data-type={feedback.type}>
                {feedback.type === "success" && "✓"}
                {feedback.type === "error" && "✕"}
                {feedback.type === "warning" && "!"}
              </span>
              <span className={styles.message}>{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className={styles.hint}>
        Each action type has a distinct sound that reinforces its meaning.
      </p>
    </div>
  );
}
