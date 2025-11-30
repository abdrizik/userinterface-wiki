import type { source } from "@/markdown/lib/source";

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

export type PageData = NonNullable<ReturnType<typeof source.getPage>>["data"];
