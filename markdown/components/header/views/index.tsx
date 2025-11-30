import { ViewsIcon } from "@/components/icons/views";
import styles from "./styles.module.css";

interface ViewsProps {
  views: number;
}

export function Views({ views = 13_2412 }: ViewsProps) {
  const value = new Intl.NumberFormat("en-US", {
    notation: "standard",
    compactDisplay: "short",
  }).format(views);

  return (
    <div className={styles.views}>
      <ViewsIcon className={styles.icon} />
      {value}
      &nbsp;views
    </div>
  );
}
