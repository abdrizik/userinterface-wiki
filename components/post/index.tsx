import { clsx } from "clsx";
import Link from "next/link";
import type { Page } from "@/lib/types";
import { getFormattedPageFromPageSource } from "@/markdown/functions/get-page";
import { Code } from "../icons";
import styles from "./styles.module.css";

interface PageCardProps {
  className?: string;
  page: Page;
}

export function PageCard({ page, className, ...props }: PageCardProps) {
  const { title, description, author, date } =
    getFormattedPageFromPageSource(page);

  return (
    <Link
      href={{ pathname: page.url }}
      className={clsx(styles.post, className)}
      {...props}
    >
      <div className={styles.details}>
        <div className={styles.preview}>
          <Code />
        </div>
        <div>
          <h2 className={styles.title}>{title}</h2>
          <span className={styles.meta}>
            <span>{author.name}</span>
            <span className={styles.separator} />
            <span>{date.published}</span>
          </span>
        </div>
      </div>
      <div>
        <p className={styles.description}>{description}</p>
      </div>
    </Link>
  );
}
