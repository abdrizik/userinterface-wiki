import { Field } from "@base-ui-components/react/field";
import React from "react";
import { SearchIcon } from "@/components/icons/search";
import { PageCard } from "@/components/post";

import { source } from "@/markdown/lib/source";
import styles from "./styles.module.css";

export const HomeLayout = async () => {
  const pages = source.getPages();

  return (
    <React.Fragment>
      <div className={styles.header}>
        <h1 className={styles.title}>
          The Open Source Wiki for User Interfaces
        </h1>
      </div>
      <div className={styles.container}>
        <Field.Root className={styles.search}>
          <SearchIcon className={styles.icon} size={18} />
          <Field.Control
            required
            placeholder="Search..."
            className={styles.input}
          />
        </Field.Root>
        <div className={styles.posts}>
          {pages.map((page) => {
            return (
              <PageCard key={page.url} page={page} className={styles.post} />
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
};
