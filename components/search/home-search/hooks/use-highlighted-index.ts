"use client";

import * as React from "react";
import { usePrevious } from "react-use";

/**
 * Hook to manage highlighted index in a suggestion list.
 * Resets to 0 when the tracked value changes.
 */
export function useHighlightedIndex(trackedValue: string) {
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const prevValue = usePrevious(trackedValue);

  React.useEffect(() => {
    if (prevValue !== trackedValue && highlightedIndex !== 0) {
      setHighlightedIndex(0);
    }
  }, [trackedValue, prevValue, highlightedIndex]);

  return {
    highlightedIndex,
    setHighlightedIndex,
    resetHighlight: () => setHighlightedIndex(0),
  };
}
