import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Category } from "@/components/category";
import { CalendarIcon, ViewsIcon } from "@/components/icons";
import { getInitials } from "@/lib";
import type { Page } from "@/lib/types";
import { formatViews } from "@/lib/views";
import { getPage } from "@/markdown/functions/get-page";
import styles from "./styles.module.css";

interface HeaderProps {
  page: Page;
  views: number;
}

export function Header({ page, views }: HeaderProps) {
  const {
    title,
    description,
    tags,
    author: { name, avatar },
    coauthors,
    published,
  } = getPage(page);

  const formattedViews = formatViews(views);

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <div className={styles.metadata}>
        <Button size="small" variant="text">
          <Avatar.Root aria-label={`Avatar of ${name}`}>
            <Avatar.Image src={avatar} alt={`Avatar of ${name}`} />
            <Avatar.Fallback initials={getInitials(name)} />
          </Avatar.Root>
          {name}
        </Button>
        {coauthors.length > 0 && (
          <ul className={styles.coauthors} aria-label="Co-authors">
            {coauthors.map(({ name: coauthorName, avatar: coauthorAvatar }) => (
              <Avatar.Root key={coauthorName} className={styles.coauthor}>
                <Avatar.Image
                  src={coauthorAvatar}
                  alt={`Avatar of ${coauthorName}`}
                />
                <Avatar.Fallback initials={getInitials(coauthorName)} />
              </Avatar.Root>
            ))}
          </ul>
        )}
        <Button size="small" variant="text">
          <CalendarIcon size={18} />
          {published}
        </Button>
        <Button size="small" variant="text">
          <ViewsIcon size={18} />
          {formattedViews}
          &nbsp;views
        </Button>
        <Category.Root>
          {tags.slice(0, 1).map((tag) => (
            <Category.Chip key={tag} label={tag} />
          ))}
          <Category.Overflow categories={tags.slice(1)} />
        </Category.Root>
      </div>
    </header>
  );
}

export default Header;
