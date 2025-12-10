"use client";

import { useEffect, useRef } from "react";

interface ViewTrackerProps {
  slug: string;
}

/**
 * Invisible component that increments view count once per page load
 */
export function ViewTracker({ slug }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Fire and forget - don't block rendering
    fetch(`/api/views/${slug}`, { method: "POST" }).catch(() => {
      // Silently fail - views are not critical
    });
  }, [slug]);

  return null;
}
