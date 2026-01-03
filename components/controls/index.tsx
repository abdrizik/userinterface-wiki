"use client";

import clsx from "clsx";
import type React from "react";
import styles from "./styles.module.css";

interface ControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Controls({ className, children, ...props }: ControlsProps) {
  return (
    <div className={clsx(styles.controls, className)} {...props}>
      {children}
    </div>
  );
}

export { Controls };
