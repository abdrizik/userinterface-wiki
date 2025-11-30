import { CalendarIcon } from "@/components/icons/calendar";
import styles from "./styles.module.css";

interface PublishedProps {
  published: string;
}

export function Published({ published }: PublishedProps) {
  const date = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(published));

  return (
    <div className={styles.published}>
      <CalendarIcon className={styles.icon} />
      <time className={styles.time} dateTime={published}>
        {date}
      </time>
    </div>
  );
}
