"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

const SAMPLE_TEXT = `The ::highlight() pseudo-element allows you to style arbitrary text ranges 
without modifying the DOM. This is useful for search highlighting, syntax 
highlighting, and collaborative editing features. The CSS Custom Highlight 
API provides a programmatic way to register and style these ranges.`;

export function HighlightDemo() {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [searchTerm, setSearchTerm] = useState("highlight");
  const [isSupported, setIsSupported] = useState(true);

  // Inject ::highlight() styles dynamically (can't be parsed by CSS modules)
  useEffect(() => {
    const styleId = "highlight-demo-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      ::highlight(search-highlight) {
        background: var(--mint-5);
        color: var(--mint-12);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, []);

  useEffect(() => {
    // Check if the API is supported
    if (typeof CSS === "undefined" || !("highlights" in CSS)) {
      setIsSupported(false);
      return;
    }

    const textNode = textRef.current;
    if (!textNode || !searchTerm.trim()) {
      CSS.highlights.clear();
      return;
    }

    const text = textNode.textContent || "";
    const ranges: Range[] = [];
    const searchLower = searchTerm.toLowerCase();
    const textLower = text.toLowerCase();

    let startPos = 0;
    let pos = textLower.indexOf(searchLower, startPos);

    // Find all occurrences
    while (pos !== -1) {
      const range = new Range();
      const walker = document.createTreeWalker(
        textNode,
        NodeFilter.SHOW_TEXT,
        null,
      );

      let currentPos = 0;
      let node = walker.nextNode();

      while (node) {
        const nodeLength = node.textContent?.length || 0;
        const nodeEnd = currentPos + nodeLength;

        if (currentPos <= pos && pos < nodeEnd) {
          range.setStart(node, pos - currentPos);
        }

        if (
          currentPos < pos + searchTerm.length &&
          pos + searchTerm.length <= nodeEnd
        ) {
          range.setEnd(node, pos + searchTerm.length - currentPos);
          break;
        }

        currentPos = nodeEnd;
        node = walker.nextNode();
      }

      if (range.startContainer && range.endContainer) {
        ranges.push(range);
      }

      startPos = pos + 1;
      pos = textLower.indexOf(searchLower, startPos);
    }

    // Create and register the highlight
    if (ranges.length > 0) {
      const highlight = new Highlight(...ranges);
      CSS.highlights.set("search-highlight", highlight);
    } else {
      CSS.highlights.delete("search-highlight");
    }

    return () => {
      CSS.highlights.delete("search-highlight");
    };
  }, [searchTerm]);

  return (
    <div className={styles.container}>
      <div className={styles.search}>
        <label htmlFor="search-input" className={styles.label}>
          Search term:
        </label>
        <input
          id="search-input"
          type="text"
          className={styles.input}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to highlight..."
        />
      </div>

      <motion.div
        className={styles.textbox}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {!isSupported && (
          <div className={styles.warning}>
            CSS Custom Highlight API is not supported in this browser.
          </div>
        )}
        <p ref={textRef} className={styles.text}>
          {SAMPLE_TEXT}
        </p>
      </motion.div>

      <div className={styles.code}>
        <code className={styles.snippet}>
          {`::highlight(search-highlight) {
  background: var(--mint-5);
  color: var(--mint-12);
}`}
        </code>
      </div>
    </div>
  );
}
