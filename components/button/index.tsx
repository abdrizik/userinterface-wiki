"use client";

import { Button as BaseButton } from "@base-ui-components/react/button";
import clsx from "clsx";
import { motion } from "motion/react";
import type React from "react";
import styles from "./styles.module.css";

const MotionBaseButton = motion.create(BaseButton);

interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof MotionBaseButton> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "medium" | "large";
}

function Button({ ...props }: ButtonProps) {
  return (
    <MotionBaseButton
      data-size={props.size || "medium"}
      data-variant={props.variant || "primary"}
      className={clsx(styles.button)}
      {...props}
    />
  );
}

export { Button };
