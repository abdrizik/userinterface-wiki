import React from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Category } from "@/components/category";
import {
  CalendarIcon,
  CopyIcon,
  DownloadIcon,
  GithubIcon,
  LinkIcon,
  ViewsIcon,
} from "@/components/icons";
import { getInitials } from "@/lib";
import type { Author, Page } from "@/lib/types";
import { getPage } from "@/markdown/functions/get-page";
import styles from "./styles.module.css";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <React.Fragment>
      <h3 className={styles.label}>{title}</h3>
      <div className={styles.content}>{children}</div>
    </React.Fragment>
  );
}

function Coauthors({ coauthors }: { coauthors: Author[] }) {
  return (
    <ul className={styles.coauthors} aria-label="Co-authors">
      {coauthors.map(({ name, avatar }) => (
        <Avatar.Root key={name} className={styles.coauthor}>
          <Avatar.Image src={avatar} alt={`Avatar of ${name}`} />
          <Avatar.Fallback initials={getInitials(name)} />
        </Avatar.Root>
      ))}
    </ul>
  );
}

export function Header({ page }: { page: Page }) {
  const {
    title,
    description,
    tags,
    author: { name, avatar },
    coauthors,
    published,
    views,
  } = getPage(page);

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <div className={styles.metadata}>
        <Section title="Properties">
          <Button size="small" variant="ghost">
            <Avatar.Root aria-label={`Avatar of ${name}`}>
              <Avatar.Image src={avatar} alt={`Avatar of ${name}`} />
              <Avatar.Fallback initials={getInitials(name)} />
            </Avatar.Root>
            {name}
          </Button>
          {coauthors.length > 0 && <Coauthors coauthors={coauthors} />}
          <Button size="small" variant="ghost">
            <CalendarIcon size={18} />
            {published}
          </Button>
          <Button size="small" variant="ghost">
            <ViewsIcon size={18} />
            {views}
            &nbsp;views
          </Button>
        </Section>
        <Section title="Categories">
          <Category.Root>
            {tags.slice(0, 3).map((tag) => (
              <Category.Chip key={tag} label={tag} />
            ))}
            <Category.Overflow categories={tags.slice(3)} />
          </Category.Root>
        </Section>
        <Section title="Resources">
          <Button size="small" variant="ghost">
            <CopyIcon size={18} />
            Copy Text
          </Button>
          <Button size="small" variant="ghost">
            <LinkIcon size={18} />
            Share Link
          </Button>
          <Button size="small" variant="ghost">
            <GithubIcon size={18} />
            View Github
          </Button>
          <Button size="small" variant="ghost">
            <DownloadIcon size={18} />
            Download Media
          </Button>
        </Section>
      </div>
    </header>
  );
}

export default Header;
