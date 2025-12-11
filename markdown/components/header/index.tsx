import type { Page } from "@/lib/types";
import { getPage } from "@/markdown/functions/get-page";
import styles from "./styles.module.css";

interface HeaderProps {
  page: Page;
  views: number;
}

export function Header({ page }: HeaderProps) {
  const {
    title,

    author,
    coauthors,
    published,
  } = getPage(page.data);

  const hasCoauthors = coauthors && coauthors.length > 0;
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.metadata}>
        {published}&nbsp;by&nbsp;
        {author.name}
        {hasCoauthors && <span>&nbsp;and {coauthors.length} others</span>}
      </div>
    </header>
  );
}

export default Header;
