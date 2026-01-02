"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

const SLIDES = [
  { id: 1, color: "--mint-9", label: "Slide 1" },
  { id: 2, color: "--purple-9", label: "Slide 2" },
  { id: 3, color: "--amber-9", label: "Slide 3" },
  { id: 4, color: "--blue-9", label: "Slide 4" },
  { id: 5, color: "--red-9", label: "Slide 5" },
] as const;

export function ScrollMarkersDemo() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check for scroll-marker support (currently limited)
    // For now, we'll implement a manual version that demonstrates the concept
    const checkSupport = () => {
      // scroll-marker-group is a very new feature
      // We'll show a fallback implementation
      setIsSupported(false);
    };
    checkSupport();
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const handleScroll = () => {
      const scrollLeft = scroller.scrollLeft;
      const slideWidth = scroller.offsetWidth;
      const newIndex = Math.round(scrollLeft / slideWidth);
      setActiveIndex(newIndex);
    };

    scroller.addEventListener("scroll", handleScroll);
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSlide = (index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const slideWidth = scroller.offsetWidth;
    scroller.scrollTo({
      left: slideWidth * index,
      behavior: "smooth",
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.carousel}>
        <div ref={scrollerRef} className={styles.scroller}>
          {SLIDES.map((slide) => (
            <motion.div
              key={slide.id}
              className={styles.slide}
              style={{ background: `var(${slide.color})` }}
              initial={{ opacity: 0.8 }}
              whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.8 }}
            >
              <span className={styles.slideLabel}>{slide.label}</span>
            </motion.div>
          ))}
        </div>

        <div className={styles.markers}>
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={styles.marker}
              data-active={index === activeIndex}
              onClick={() => scrollToSlide(index)}
              aria-label={`Go to ${slide.label}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      </div>

      <div className={styles.info}>
        {!isSupported ? (
          <p className={styles.note}>
            <code>::scroll-marker</code> is coming to CSS. This demo shows a
            JavaScript implementation of the same pattern that will soon be
            achievable with pure CSS.
          </p>
        ) : (
          <p className={styles.note}>
            Native <code>::scroll-marker</code> support detected!
          </p>
        )}
      </div>

      <div className={styles.code}>
        <code className={styles.snippet}>
          {`.scroller {
  scroll-marker-group: after;
}

.slide::scroll-marker {
  content: "";
  width: 8px;
  height: 8px;
  background: var(--gray-8);
  border-radius: 50%;
}

.slide::scroll-marker:target-current {
  background: var(--gray-12);
}`}
        </code>
      </div>
    </div>
  );
}
