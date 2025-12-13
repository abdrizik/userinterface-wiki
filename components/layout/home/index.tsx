"use client";

import { Field } from "@base-ui-components/react/field";
import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { Code } from "@/components/icons";
import { PageTransition } from "@/components/page-transition";
import type { FormattedPage } from "@/lib/modules/content";
import styles from "./styles.module.css";

export function HomeLayout({ pages }: { pages: FormattedPage[] }) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(pages, {
        keys: ["title", "description", "author.name", "tags"],
        threshold: 0.3,
        includeScore: true,
      }),
    [pages],
  );

  const filteredPages = useMemo(() => {
    const q = query.trim();
    if (!q) return pages;

    return fuse.search(q).map((result) => result.item);
  }, [fuse, pages, query]);

  return (
    <PageTransition>
      <div className={styles.header}>
        <h1 className={styles.title}>A Living Manual for Better Interfaces</h1>
      </div>

      <div className={styles.container}>
        <Field.Root>
          <Field.Control
            type="search"
            className={styles.input}
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field.Root>

        {filteredPages.length !== 0 && (
          <ul className={styles.list}>
            {filteredPages.map((page) => (
              <li key={page.url} className={styles.item}>
                <a href={page.url as "/"} className={styles.page}>
                  <div className={styles.details}>
                    <Code className={styles.icon} />
                    <div className={styles.meta}>
                      <span className={styles.title}>{page.title}</span>
                      <div className={styles.subtitle}>
                        <span>{page.author.name}</span>
                        <div className={styles.dot} />
                        <span>{page.date.published}</span>
                      </div>
                    </div>
                  </div>
                  <span className={styles.description}>{page.description}</span>

                  {page.tags.length > 0 && (
                    <div className={styles.tags}>
                      {page.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageTransition>
  );
}
