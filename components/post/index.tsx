import { clsx } from "clsx";
import Link from "next/link";
import {
  CodePreview,
  EssayPreview,
  MotionPreview,
} from "@/components/previews";
import type { FormattedPage } from "@/lib/source";
import styles from "./styles.module.css";

function formatRowDate(dateString: string): { year: string; dayMonth: string } {
  const date = new Date(dateString);
  const year = date.getFullYear().toString();
  const dayMonth = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
  return { year, dayMonth };
}

type ViewMode = "card" | "row";

interface PageItemProps {
  className?: string;
  page: FormattedPage;
  viewMode: ViewMode;
}

export function PageItem({ page, className, viewMode }: PageItemProps) {
  const { title, description, author, date, icon, url } = page;
  const { year, dayMonth } = formatRowDate(date.published);

  const Icon = () => {
    switch (icon) {
      case "motion":
        return <MotionPreview />;
      case "code":
        return <CodePreview seed={title} />;
      case "writing":
        return <EssayPreview seed={title} />;
      default:
        return <EssayPreview seed={title} />;
    }
  };

  if (viewMode === "row") {
    return (
      <Link href={{ pathname: url }} className={clsx(styles.row, className)}>
        <span className={styles["row-year"]}>{year}</span>
        <span className={styles["row-title"]}>{title}</span>
        <span className={styles["row-date"]}>{dayMonth}</span>
      </Link>
    );
  }

  return (
    <Link href={{ pathname: url }} className={clsx(styles.post, className)}>
      <div className={styles.details}>
        <div className={styles.preview}>
          <Icon />
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

// Legacy exports for backwards compatibility
interface PageCardProps {
  className?: string;
  page: FormattedPage;
}

export function PageCard({ page, className }: PageCardProps) {
  return <PageItem page={page} className={className} viewMode="card" />;
}

interface PageRowProps {
  className?: string;
  page: FormattedPage;
}

export function PageRow({ page, className }: PageRowProps) {
  return <PageItem page={page} className={className} viewMode="row" />;
}
