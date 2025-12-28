"use client";

import styles from "./styles.module.css";

interface TableOfContentsProps {
  className?: string;
}

export function TableOfContents({ className }: TableOfContentsProps) {
  // TODO: Extract headings from content and render TOC
  return (
    <nav className={className ?? styles.toc} aria-label="Table of contents" />
  );
}
