import { normalizeWord } from "@/lib/text/normalize-word";
import type { WordTimestamp } from "./store";

export interface SpanMeta {
  element: HTMLElement;
  normalized: string;
}

const HIGHLIGHT_TOLERANCE = 0.05;

export function collectSpans(): SpanMeta[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-word-id]"),
  ).map((element) => ({
    element,
    normalized:
      element.dataset.wordNormalized ||
      normalizeWord(element.textContent ?? ""),
  }));
}

export function alignTimeline(timestamps: WordTimestamp[], spans: SpanMeta[]) {
  const mapping: number[] = new Array(timestamps.length).fill(-1);
  let spanIndex = 0;

  timestamps.forEach((entry, entryIndex) => {
    const normalized = entry.normalized;
    if (!normalized) return;

    for (let i = spanIndex; i < spans.length; i++) {
      const candidate = spans[i];
      if (!candidate.normalized) continue;
      if (candidate.normalized === normalized) {
        mapping[entryIndex] = i;
        spanIndex = i + 1;
        return;
      }
    }
  });

  return mapping;
}

export function locateWordIndex(
  currentTime: number,
  timestamps: WordTimestamp[],
  lastIndex: number,
) {
  if (!timestamps.length) return -1;

  const startOf = (entry: WordTimestamp) => entry.start ?? entry.end ?? 0;
  const endOf = (entry: WordTimestamp) => entry.end ?? entry.start ?? 0;

  let index = Math.max(-1, Math.min(lastIndex, timestamps.length - 1));

  if (index === -1) {
    if (currentTime < startOf(timestamps[0]) - HIGHLIGHT_TOLERANCE) {
      return -1;
    }
    index = 0;
  }

  while (
    index + 1 < timestamps.length &&
    currentTime >= startOf(timestamps[index + 1]) - HIGHLIGHT_TOLERANCE
  ) {
    index += 1;
  }

  while (
    index > 0 &&
    currentTime < startOf(timestamps[index]) - HIGHLIGHT_TOLERANCE
  ) {
    index -= 1;
  }

  const current = timestamps[index];
  const currentStart = startOf(current);
  const currentEnd = endOf(current);

  const withinCurrent =
    currentTime >= currentStart - HIGHLIGHT_TOLERANCE &&
    currentTime <= currentEnd + HIGHLIGHT_TOLERANCE;

  if (withinCurrent) {
    return index;
  }

  if (currentTime > currentEnd + HIGHLIGHT_TOLERANCE) {
    if (index + 1 >= timestamps.length) {
      return timestamps.length - 1;
    }

    const nextStart = startOf(timestamps[index + 1]);
    if (currentTime < nextStart - HIGHLIGHT_TOLERANCE) {
      return index;
    }

    return index + 1;
  }

  if (currentTime < currentStart - HIGHLIGHT_TOLERANCE) {
    if (index === 0) {
      return -1;
    }
    return index - 1;
  }

  return index;
}

export function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}
