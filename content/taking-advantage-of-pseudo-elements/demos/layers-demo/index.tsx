"use client";

import { motion } from "motion/react";
import { useState } from "react";
import styles from "./styles.module.css";

const LAYER_STYLES = [
  { id: "glow", label: "Glow", value: "glow" },
  { id: "gradient", label: "Gradient", value: "gradient" },
  { id: "shine", label: "Shine", value: "shine" },
  { id: "border", label: "Border", value: "border" },
] as const;

type LayerStyle = (typeof LAYER_STYLES)[number]["value"];

export function LayersDemo() {
  const [layerStyle, setLayerStyle] = useState<LayerStyle>("glow");

  return (
    <div className={styles.container}>
      <div className={styles.picker}>
        {LAYER_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            className={styles.option}
            data-selected={layerStyle === style.value}
            onClick={() => setLayerStyle(style.value)}
            aria-pressed={layerStyle === style.value}
          >
            {style.label}
          </button>
        ))}
      </div>

      <div className={styles.visual}>
        <motion.button
          type="button"
          className={styles.button}
          data-style={layerStyle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className={styles.label}>Hover me</span>
        </motion.button>
      </div>

      <div className={styles.code}>
        <code className={styles.snippet}>
          {layerStyle === "glow" &&
            `.button::before {
  content: "";
  position: absolute;
  inset: 0;
  background: inherit;
  filter: blur(16px);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.2s;
}

.button:hover::before {
  opacity: 0.6;
}`}
          {layerStyle === "gradient" &&
            `.button::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    var(--mint-9),
    var(--purple-9)
  );
  border-radius: inherit;
  z-index: -1;
}`}
          {layerStyle === "shine" &&
            `.button::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255,255,255,0.4) 50%,
    transparent 60%
  );
  transform: translateX(-100%);
}

.button:hover::after {
  transform: translateX(100%);
  transition: transform 0.6s;
}`}
          {layerStyle === "border" &&
            `.button::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 2px;
  background: linear-gradient(
    135deg,
    var(--mint-9),
    var(--purple-9)
  );
  border-radius: inherit;
  mask: 
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
}`}
        </code>
      </div>
    </div>
  );
}
