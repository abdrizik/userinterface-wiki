import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import type { Author } from "../types";
import { schema } from "./schema";

const directory = join(dirname(fileURLToPath(import.meta.url)), "data");

const registry = new Set<string>();

export const authors = readdirSync(directory)
  .filter((filename) => filename.endsWith(".json"))
  .sort((a, b) => a.localeCompare(b))
  .map((filename) => {
    const paths = {
      absoulute: join(directory, filename),
      relative: relative(process.cwd(), join(directory, filename)),
    };

    let definition: unknown;

    try {
      const contents = readFileSync(paths.absoulute, "utf8");
      definition = JSON.parse(contents);
    } catch (error) {
      throw new Error(
        `Unable to read author file ${paths.relative}: ${(error as Error).message}`,
      );
    }

    const result = schema.safeParse(definition);

    if (!result.success) {
      throw new Error(
        `Invalid author definition in ${paths.relative}: ${result.error.message}`,
      );
    }

    return result.data;
  })
  .map((author) => {
    if (registry.has(author.id)) {
      throw new Error(`Duplicate author id detected: ${author.id}`);
    }

    registry.add(author.id);

    return author;
  });

export function getAuthorById(id: string): Author {
  const author = new Map<string, Author>(
    authors.map((author) => [author.id, author]),
  ).get(id);

  if (!author) {
    throw new Error(`Author not found for id: ${id}`);
  }

  return author;
}
