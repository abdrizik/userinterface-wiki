import z from "zod";
import type { Author } from "@/lib/types";

const slug = /^[a-z0-9-]+$/;

export const schema = z
  .object({
    id: z.string().regex(slug),
    name: z.string().min(1),
    bio: z.string().min(1).optional(),
    avatar: z.string().url().optional(),
    socials: z
      .object({
        twitter: z.url().optional(),
        instagram: z.url().optional(),
        cosmos: z.url().optional(),
        github: z.url().optional(),
        linkedin: z.url().optional(),
        website: z.url().optional(),
      })
      .optional(),
  })
  .strict() satisfies z.ZodType<Author>;
