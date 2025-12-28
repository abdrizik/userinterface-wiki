"use client";

import styles from "./styles.module.css";

interface FooterProps {
  className?: string;
  children?: React.ReactNode;
}

export function Footer({ className, children }: FooterProps) {
  return <div className={className ?? styles.footer}>{children}</div>;
}
