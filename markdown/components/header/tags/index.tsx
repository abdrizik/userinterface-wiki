import Image from "next/image";
import title from "title";
import { getInitials } from "@/lib";
import { getAuthorById } from "@/lib/authors";
import { getColorHash } from "@/lib/get-color-hash";
import type { PageData } from "@/lib/types";
import styles from "./styles.module.css";

export function Header({ page }: { page: PageData }) {
  const author = getAuthorById(page.author);

  const Title = () => {
    return <h1 className={styles.title}>{page.title}</h1>;
  };

  const Published = () => {
    const published = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(page.date.published));

    return (
      <time className={styles.time} dateTime={page.date.published}>
        {published}&nbsp;
      </time>
    );
  };

  const Avatar = () => {
    const name = author.name;

    if (author.avatar) {
      return (
        <span className={styles.avatar}>
          <Image
            unoptimized
            className={styles.photo}
            src={author.avatar}
            alt={`Avatar of ${name}`}
            width={24}
            height={24}
            loading="lazy"
            sizes="24px"
          />
        </span>
      );
    }

    const initials = getInitials(name);

    const background = getColorHash(initials);

    return (
      <span
        className={`${styles.avatar} ${styles.fallback}`}
        style={{ background }}
        role="img"
        aria-label={`Avatar for ${name}`}
      >
        {initials}
      </span>
    );
  };

  const Authors = () => {
    return (
      <div>
        <Avatar />
        <span className={styles.authors}>{author.name}</span>
      </div>
    );
  };

  const Tags = () => {
    const displayTags = page.tags.slice(0, 2).map((tag) => title(tag));
    const remaining = page.tags.length - 2;

    return (
      <span className={styles.tags}>
        {displayTags.join(", ")}
        {remaining > 0 && `, +${remaining}`}
      </span>
    );
  };

  const Separator = () => {
    return <span className={styles.separator}> · </span>;
  };

  return (
    <header className={styles.header}>
      <Title />
      <span className={styles.meta}>
        <Published />
        <Authors />
        <Separator />
        <Tags />
      </span>
    </header>
  );
}

export default Header;
