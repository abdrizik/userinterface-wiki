import { DotGrid1X3HorizontalIcon, PlayIcon } from "@/icons";
import { formatPageData, type Page } from "@/lib/features/content";
import styles from "./styles.module.css";

interface HeaderProps {
  page: Page;
}

export function Header({ page }: HeaderProps) {
  const { title, author, coauthors, date } = formatPageData(page.data);

  const hasCoauthors = coauthors && coauthors.length > 0;
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.metadata}>
        {date.published}&nbsp;by&nbsp;
        {author.name}
        {hasCoauthors && <span>&nbsp;and {coauthors.length} others</span>}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.action}>
          <PlayIcon size={16} />
        </button>
        <button type="button" className={styles.action}>
          <DotGrid1X3HorizontalIcon size={16} />
        </button>
      </div>
    </div>
  );
}

export default Header;
