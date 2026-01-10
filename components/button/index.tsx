"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import clsx from "clsx";
import { motion } from "motion/react";
import type React from "react";
import styles from "./styles.module.css";

const MotionBaseButton = motion.create(BaseButton);

interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof MotionBaseButton> {
  variant?: "primary" | "secondary" | "ghost" | "text";
  size?: "small" | "medium" | "large";
  aspect?: "default" | "square";
  radius?: "none" | "small" | "medium" | "large" | "full";
}

function Button({
  className,
  variant = "primary",
  size = "medium",
  aspect = "default",
  radius,
  ...props
}: ButtonProps) {
  return (
    <MotionBaseButton
      data-button
      className={clsx(
        styles.button,
        styles[size],
        styles[variant],
        aspect === "square" && styles.square,
        radius && styles[`radius-${radius}`],
        className,
      )}
      {...props}
    />
  );
}

export { Button };
