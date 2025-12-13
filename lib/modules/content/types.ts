import type { Author } from "@/lib/types";
import type { source } from "./source";

/**
 * A full page object from Fumadocs source.
 */
export type Page = NonNullable<ReturnType<typeof source.getPage>>;

/**
 * The frontmatter/metadata portion of a page.
 */
export type PageData = NonNullable<ReturnType<typeof source.getPage>>["data"];

/**
 * A formatted page with resolved author data and formatted dates.
 * This is the canonical shape for displaying page metadata in components.
 */
export interface FormattedPage {
  url: string;
  title: string;
  description: string;
  tags: string[];
  author: Author;
  coauthors: Author[];
  date: {
    published: string;
  };
}
