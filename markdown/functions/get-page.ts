import { getAuthorById } from "@/lib/authors";
import type { Author, Page, PageData } from "@/lib/types";

export function getPageAuthor(page: PageData): Author {
  if (!page.author) {
    throw new Error("Author id is required.");
  }
  return getAuthorById(page.author);
}

export function getPageCoauthors(page: PageData): Author[] {
  return (page.coauthors ?? []).map(getAuthorById);
}

export function getPagePublishedDate(page: PageData) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(page.date.published));
}

export function getPage(page: PageData) {
  return {
    title: page.title,
    description: page.description,
    tags: page.tags ?? [],
    author: getPageAuthor(page),
    coauthors: getPageCoauthors(page),
    published: getPagePublishedDate(page),
  };
}

export function getFormattedPageFromPageSource(data: Page) {
  const { data: page } = data;

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
