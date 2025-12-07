import { getAuthorById } from "@/lib/authors";
import type { Author, Page } from "@/lib/types";

export function getPageAuthor(page: Page): Author {
  if (!page.author) {
    throw new Error("Author id is required.");
  }
  return getAuthorById(page.author);
}

export function getPageCoauthors(page: Page): Author[] {
  return (page.coauthors ?? []).map(getAuthorById);
}

export function getPageViews(page: Page) {
  return new Intl.NumberFormat("en-US", {
    notation: "standard",
    compactDisplay: "short",
  }).format(page.views);
}

export function getPagePublishedDate(page: Page) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(page.date.published));
}

export function getPage(page: Page) {
  return {
    title: page.title,
    description: page.description,
    tags: page.tags ?? [],
    author: getPageAuthor(page),
    coauthors: getPageCoauthors(page),
    views: getPageViews(page),
    published: getPagePublishedDate(page),
  };
}
