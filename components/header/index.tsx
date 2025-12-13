import { formatPageData, type Page } from "@/lib/modules/content";
import styles from "./styles.module.css";

interface HeaderProps {
  page: Page;
  views: number;
}

export function Header({ page }: HeaderProps) {
  const { title, author, coauthors, date } = formatPageData(page.data);

  const hasCoauthors = coauthors && coauthors.length > 0;
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.metadata}>
        {date.published}&nbsp;by&nbsp;
        {author.name}
        {hasCoauthors && <span>&nbsp;and {coauthors.length} others</span>}
      </div>
    </header>
  );
}

export default Header;
