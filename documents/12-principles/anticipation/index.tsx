"use client";

import { Checkbox } from "@base-ui-components/react/checkbox";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, Bolt, Check, HighPriority, InProgress } from "./icons";
import styles from "./styles.module.css";

interface Issue {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "in-progress" | "done" | "todo";
  assignee: string;
  date: string;
  visible: boolean;
}

const initialIssue: Issue = {
  id: "TPA-42",
  title: "Anticipate Future Deletions",
  priority: "high",
  status: "in-progress",
  assignee: "Avatar",
  date: "Dec 28",
  visible: true,
};

export function Anticipation() {
  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [isSelected, setIsSelected] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restoreTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
  }, []);

  const handleDeleteStart = useCallback(() => {
    if (!isSelected) return;

    setIsHolding(true);
    holdTimerRef.current = setTimeout(() => {
      setIssue((prev) => ({ ...prev, visible: false }));
      setIsSelected(false);
      setIsHolding(false);

      restoreTimerRef.current = setTimeout(() => {
        setIssue((prev) => ({ ...prev, visible: true }));
      }, 2000);
    }, 1000);
  }, [isSelected]);

  const handleDeleteEnd = useCallback(() => {
    setIsHolding(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const handleClearClick = useCallback(() => {
    setIsSelected(false);
    clearTimers();
  }, [clearTimers]);

  const handleIssueClick = useCallback(() => {
    if (!issue.visible) return;
    setIsSelected((prev) => !prev);
  }, [issue.visible]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return (
    <div className={styles.container}>
      <div className={styles.issues}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tasks</h2>
          <div className={styles.line} />
        </div>
        <AnimatePresence>
          {issue.visible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                ease: [0.19, 1, 0.22, 1],
                duration: 0.4,
              }}
              className={styles.issue}
              onClick={handleIssueClick}
              data-state={isSelected ? "checked" : "unchecked"}
            >
              <Checkbox.Root checked={isSelected} className={styles.checkbox}>
                <Checkbox.Indicator className={styles.indicator}>
                  <Check className={styles.check} color="var(--white)" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <div className={styles.priority}>
                <HighPriority />
              </div>
              <span className={styles.id}>{issue.id}</span>
              <InProgress className={styles.status} />
              <span className={styles.title}>{issue.title}</span>
              <div className={styles.spacer} />
              <Avatar className={styles.avatar} />
              <div className={styles.date}>{issue.date}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{
              opacity: 0,
              y: 64,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 64,
              scale: 1,
            }}
            transformTemplate={(_latest, generated) =>
              `translate(-50%, -0%) ${generated}`
            }
            transition={{
              ease: [0.19, 1, 0.22, 1],
              duration: 0.6,
            }}
            className={styles.popup}
          >
            <Bolt className={styles.bolt} />
            <span className={styles.selected}>Quick Actions</span>
            <button
              type="button"
              className={styles.clear}
              onClick={handleClearClick}
            >
              Clear
            </button>
            <button
              type="button"
              className={styles.delete}
              onMouseDown={handleDeleteStart}
              onMouseUp={handleDeleteEnd}
              onMouseLeave={handleDeleteEnd}
              onTouchStart={handleDeleteStart}
              onTouchEnd={handleDeleteEnd}
              data-holding={isHolding}
            >
              <div aria-hidden="true" className={styles.hold} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
