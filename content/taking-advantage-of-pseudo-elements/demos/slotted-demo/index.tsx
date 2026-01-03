"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

const SLOT_STYLES = [
  { id: "default", label: "Default", value: "default" },
  { id: "styled", label: "Styled", value: "styled" },
  { id: "animated", label: "Animated", value: "animated" },
] as const;

type SlotStyle = (typeof SLOT_STYLES)[number]["value"];

export function SlottedDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slotStyle, setSlotStyle] = useState<SlotStyle>("default");
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Register the custom element if not already done
    if (typeof window !== "undefined" && !customElements.get("demo-card")) {
      class DemoCard extends HTMLElement {
        constructor() {
          super();
          const shadow = this.attachShadow({ mode: "open" });

          const style = document.createElement("style");
          style.textContent = `
            :host {
              display: block;
              padding: 20px;
              background: var(--gray-2, #f5f5f5);
              border-radius: 16px;
              border: 1px solid var(--gray-6, #e0e0e0);
            }

            .header {
              margin-bottom: 12px;
            }

            ::slotted([slot="title"]) {
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              color: var(--gray-12, #171717);
            }

            :host([data-style="styled"]) ::slotted([slot="title"]) {
              background: linear-gradient(135deg, var(--mint-11, #0d9373), var(--purple-11, #8e4ec6));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            :host([data-style="animated"]) ::slotted([slot="title"]) {
              animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }

            ::slotted([slot="content"]) {
              margin: 0;
              font-size: 14px;
              line-height: 1.6;
              color: var(--gray-11, #6f6f6f);
            }

            :host([data-style="styled"]) ::slotted([slot="content"]),
            :host([data-style="animated"]) ::slotted([slot="content"]) {
              padding: 12px;
              background: var(--gray-3, #ededed);
              border-radius: 8px;
            }
          `;

          const wrapper = document.createElement("div");
          wrapper.innerHTML = `
            <div class="header">
              <slot name="title"></slot>
            </div>
            <slot name="content"></slot>
          `;

          shadow.appendChild(style);
          shadow.appendChild(wrapper);
        }
      }

      customElements.define("demo-card", DemoCard);
      setIsRegistered(true);
    } else {
      setIsRegistered(true);
    }
  }, []);

  // Update the data-style attribute when slotStyle changes
  useEffect(() => {
    if (!containerRef.current || !isRegistered) return;
    const card = containerRef.current.querySelector("demo-card");
    if (card) {
      card.setAttribute("data-style", slotStyle);
    }
  }, [slotStyle, isRegistered]);

  return (
    <div className={styles.container}>
      <div className={styles.picker}>
        {SLOT_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            className={styles.option}
            data-selected={slotStyle === style.value}
            onClick={() => setSlotStyle(style.value)}
            aria-pressed={slotStyle === style.value}
          >
            {style.label}
          </button>
        ))}
      </div>

      <motion.div
        ref={containerRef}
        className={styles.visual}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={
          isRegistered
            ? {
                __html: `
                  <demo-card data-style="${slotStyle}">
                    <h3 slot="title">Slotted Content</h3>
                    <p slot="content">
                      This content is passed into the web component via slots and styled
                      using the ::slotted() pseudo-element.
                    </p>
                  </demo-card>
                `,
              }
            : undefined
        }
      />

      <div className={styles.code}>
        <code className={styles.snippet}>
          {`/* Inside shadow DOM stylesheet */
::slotted([slot="title"]) {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-12);
}

::slotted([slot="content"]) {
  font-size: 14px;
  line-height: 1.6;
  color: var(--gray-11);
}`}
        </code>
      </div>
    </div>
  );
}
