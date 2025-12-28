"use client";

import { useDocumentContext } from "./context";
import styles from "./styles.module.css";

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const { page } = useDocumentContext("Breadcrumb");

  return (
    <nav className={className ?? styles.breadcrumb} aria-label="Breadcrumb">
      <ol className={styles["breadcrumb-list"]}>
        <li>
          <a href="/">Home</a>
        </li>
        {page.slugs.slice(0, -1).map((segment, index) => (
          <li key={segment}>
            <a href={`/${page.slugs.slice(0, index + 1).join("/")}`}>
              {segment}
            </a>
          </li>
        ))}
        <li aria-current="page">{page.data.title}</li>
      </ol>
    </nav>
  );
}
