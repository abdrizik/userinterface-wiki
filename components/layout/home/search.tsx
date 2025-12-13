"use client";

import Link from "next/link";
import * as React from "react";
import { Code } from "@/components/icons";
import { SearchEditor } from "@/components/search-editor";
import {
  type FilterableDocument,
  filterAndSortDocs,
} from "../../search-editor/utils";
import styles from "./search.module.css";

export interface SerializedPage {
  url: string;
  title: string;
  description: string;
  tags: string[];
  author: {
    name: string;
  };
  date: {
    published: string;
  };
}

export interface SearchProps {
  pages: SerializedPage[];
  tags: string[];
}

function toFilterable(page: SerializedPage): FilterableDocument {
  return {
    title: page.title,
    author: page.author.name,
    tag: page.tags,
    date: page.date.published,
    url: page.url,
    description: page.description,
  };
}

export function Search({ pages, tags }: SearchProps) {
  const [query, setQuery] = React.useState("");

  const authors = React.useMemo(() => {
    const authorSet = new Set<string>();
    for (const page of pages) {
      if (page.author.name) {
        authorSet.add(page.author.name);
      }
    }
    return Array.from(authorSet).sort();
  }, [pages]);

  const filteredPages = React.useMemo(() => {
    if (!query.trim()) {
      return pages;
    }
    const filterableDocs = pages.map(toFilterable);
    const results = filterAndSortDocs(filterableDocs, query);

    return results
      .map((doc) => pages.find((p) => p.url === doc.url))
      .filter((p): p is SerializedPage => p !== undefined);
  }, [pages, query]);

  return (
    <div className={styles.container}>
      <SearchEditor
        authors={authors}
        tags={tags}
        className={styles.editor}
        onQueryChange={setQuery}
        placeholder="Search…"
      />

      {filteredPages.length !== 0 && (
        <ul className={styles.list}>
          {filteredPages.map((page) => (
            <li key={page.url} className={styles.item}>
              <Link href={page.url} className={styles.page}>
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
