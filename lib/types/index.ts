export interface Author {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  socials?: {
    twitter?: string;
    instagram?: string;
    cosmos?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

// Re-export content types for backwards compatibility
export type {
  FormattedPage,
  Page,
  PageData,
} from "@/lib/modules/content/types";
