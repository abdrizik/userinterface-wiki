#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.resolve(__dirname, "../lib/authors/data");
const indexPath = path.join(dataDir, "index.ts");

function kebabToCamel(value) {
  return value.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function buildFile() {
  const files = fs
    .readdirSync(dataDir)
    .filter(
      (file) =>
        file.endsWith(".ts") && file !== "index.ts" && !file.endsWith(".d.ts"),
    )
    .sort();

  const imports = files
    .map((file) => {
      const baseName = file.replace(/\.ts$/, "");
      const identifier = kebabToCamel(baseName);
      return `import ${identifier} from "./${baseName}";`;
    })
    .join("\n");

  const identifiers = files
    .map((file) => kebabToCamel(file.replace(/\.ts$/, "")))
    .join(",\n  ");

  return `import type { Author } from "../../types";

${imports}

export const authors: Author[] = [
  ${identifiers},
];

export default authors;
`;
}

function main() {
  if (!fs.existsSync(dataDir)) {
    console.error(`Missing authors data directory: ${dataDir}`);
    process.exit(1);
  }

  const nextContents = buildFile();
  const currentContents = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, "utf8")
    : "";

  if (currentContents === nextContents) {
    console.log("authors index is up to date ✅");
    return;
  }

  fs.writeFileSync(indexPath, nextContents, "utf8");
  console.log("authors index regenerated ✨");
}

main();
