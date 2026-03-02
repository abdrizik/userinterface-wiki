"use client";

import { Calligraph } from "calligraph";
import * as chrono from "chrono-node";
import { useState } from "react";
import styles from "./styles.module.css";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PostelsLaw() {
  const [value, setValue] = useState("");

  const parsed = value.trim() ? chrono.parseDate(value.trim()) : null;
  const output = parsed
    ? formatDate(parsed)
    : value.length > 0
      ? "Unrecognized format"
      : formatDate(new Date());
  const hasError = value.length > 0 && !parsed;

  return (
    <div className={styles.container}>
      <div className={styles["input-row"]}>
        <input
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a date..."
        />
        <span className={styles.divider} />
        <div
          className={styles.output}
          data-error={hasError}
          data-empty={!value}
        >
          <Calligraph className={styles["output-text"]}>{output}</Calligraph>
        </div>
      </div>
    </div>
  );
}
