import { getAuthorById } from "@/lib/features/authors";
import type { Author } from "@/lib/types";
import type { FormattedPage, Page, PageData } from "./types";

/**
 * Resolves a page's author by ID.
 * @throws Error if author ID is missing
 */
export function getPageAuthor(page: PageData): Author {
  if (!page.author) {
    throw new Error("Author id is required.");
  }
  return getAuthorById(page.author);
}

/**
 * Resolves all coauthors for a page.
 */
export function getPageCoauthors(page: PageData): Author[] {
  return (page.coauthors ?? []).map(getAuthorById);
}

/**
 * Formats the published date for display.
 */
export function getPagePublishedDate(page: PageData): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(page.date.published));
}

/**
 * Formats page data with resolved authors and formatted dates.
 * Internal helper - use formatPage for full Page objects.
 */
function createFormattedPageData(page: PageData) {
  return {
    title: page.title,
    description: page.description,
    tags: page.tags ?? [],
    author: getPageAuthor(page),
    coauthors: getPageCoauthors(page),
    date: {
      published: getPagePublishedDate(page),
    },
  };
}

/**
 * Formats page data with resolved authors and formatted dates.
 * Use this when you have raw PageData (e.g., from `page.data`).
 */
export function formatPageData(page: PageData): Omit<FormattedPage, "url"> {
  return createFormattedPageData(page);
}

/**
 * Formats a full Page object with resolved authors and formatted dates.
 * Use this when you have a Page from `source.getPage()`.
 */
export function formatPage(page: Page): FormattedPage {
  return {
    url: page.url,
    ...createFormattedPageData(page.data),
  };
}

/**
 * Formats an array of Page objects.
 */
export function formatPages(pages: Page[]): FormattedPage[] {
  return pages.map(formatPage);
}
