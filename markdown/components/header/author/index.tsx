import clsx from "clsx";
import Image from "next/image";
import type React from "react";
import { getInitials } from "@/lib";
import { getColorHash } from "@/lib/get-color-hash";
import styles from "./styles.module.css";

interface AvatarProps {
  name: string;
  avatar?: string;
}

function Avatar({ name, avatar }: AvatarProps) {
  if (avatar) {
    return (
      <span className={styles.avatar}>
        <Image
          fill
          unoptimized
          alt={`Avatar of ${name}`}
          className={styles.photo}
          src={avatar}
        />
      </span>
    );
  }

  const initials = getInitials(name);

  const background = getColorHash(initials);

  return (
    <span
      className={`${styles.avatar} ${styles.fallback}`}
      style={{ background }}
      role="img"
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </span>
  );
}

interface AuthorProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  avatar?: string;
  withName?: boolean;
}

export function Author({
  name,
  avatar,
  withName = true,
  className,
  ...props
}: AuthorProps) {
  return (
    <div className={clsx(styles.author, className)} {...props}>
      <Avatar name={name} avatar={avatar} />
      {withName && <span className={styles.name}>{name}</span>}
    </div>
  );
}
