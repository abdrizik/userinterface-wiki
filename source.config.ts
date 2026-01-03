import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content",
  docs: {
    schema: frontmatterSchema.extend({
      date: z.object({
        published: z.iso.date(),
        modified: z.iso.date().optional(),
      }),
      description: z.string(),
      author: z.string(),
      coauthors: z.array(z.string()).optional(),
      tags: z.array(z.string()),
      icon: z.enum(["writing", "code", "motion"]).optional().default("writing"),
    }),
  },
  meta: {},
});

export default defineConfig({
  mdxOptions: {
    providerImportSource: "@/mdx-components",
    remarkPlugins: [],
    rehypePlugins: [],
    rehypeCodeOptions: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
  },
});
