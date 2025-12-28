"use client";

import { DotGrid1X3HorizontalIcon, PauseIcon, PlayIcon } from "@/icons";
import { useDocumentContext } from "./context";
import styles from "./styles.module.css";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { page, status, isPlaying, isPlayerVisible, togglePlayer, toggle } =
    useDocumentContext("Header");

  const isReady = status === "ready";

  const handlePlayClick = () => {
    if (!isReady) return;

    if (isPlaying) {
      toggle();
    } else {
      if (!isPlayerVisible) {
        togglePlayer();
      }
      toggle();
    }
  };

  const coauthors = page.data.coauthors ?? [];
  const hasCoauthors = coauthors.length > 0;

  return (
    <div className={className ?? styles.header}>
      <h1 className={styles.title}>{page.data.title}</h1>
      <div className={styles.metadata}>
        {page.data.date.published}&nbsp;by&nbsp;
        {page.data.author}
        {hasCoauthors && <span>&nbsp;and {coauthors.length} others</span>}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          onClick={handlePlayClick}
          disabled={!isReady}
          aria-label={
            isPlaying && isPlayerVisible ? "Hide player" : "Show player"
          }
        >
          {isPlaying && isPlayerVisible ? (
            <PauseIcon size={16} />
          ) : (
            <PlayIcon size={16} />
          )}
        </button>
        <button type="button" className={styles.action}>
          <DotGrid1X3HorizontalIcon size={16} />
        </button>
      </div>
    </div>
  );
}
