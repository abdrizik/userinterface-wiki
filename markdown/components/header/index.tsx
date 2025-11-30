import { getAuthorById } from "@/lib/authors";
import type { PageData } from "@/lib/types";
import { Author } from "./author";
import { Published } from "./published";
import styles from "./styles.module.css";
import { Views } from "./views";

export function Header({ page }: { page: PageData }) {
  const { title, date, tags, author, description, coauthors } = page;

  const { name, avatar } = getAuthorById(author);

  const { published } = date;

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <span className={styles.meta}>
        <Author name={name} avatar={avatar} />
        {coauthors && (
          <div className={styles.coauthors}>
            {coauthors.map((coauthorId) => {
              const coauthor = getAuthorById(coauthorId);
              return (
                <Author
                  key={coauthorId}
                  name={coauthor.name}
                  avatar={coauthor.avatar}
                  withName={false}
                  className={styles.stack}
                />
              );
            })}
          </div>
        )}
        <Published published={published} />
        <Views views={page.views ?? 132412} />
      </span>
      <p className={styles.description}>{description}</p>
    </header>
  );
}

export default Header;
