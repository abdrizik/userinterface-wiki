// Content source and loader

// Page formatting utilities
export {
  formatPage,
  formatPageData,
  formatPages,
  getPageAuthor,
  getPageCoauthors,
  getPagePublishedDate,
} from "./format";
// Plugins
export { rehypeProseTypePlugin, rehypeWordSpans } from "./plugins";
export { source } from "./source";
// Types
export type { FormattedPage, Page, PageData } from "./types";
