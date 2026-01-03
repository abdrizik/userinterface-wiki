#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(".");
const iconsRoot = path.join(repoRoot, "icons");
const updateUsages = process.argv.includes("--update-usages");

const skipDirs = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "public",
  "dist",
  "build",
  "out",
]);

const attrMap = {
  "clip-rule": "clipRule",
  "fill-rule": "fillRule",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-width": "strokeWidth",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "color-interpolation": "colorInterpolation",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "font-family": "fontFamily",
  "font-size": "fontSize",
};

const toKebab = (str) =>
  str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])([0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Za-z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const toPascal = (str) =>
  str
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const toTitle = (str) =>
  str
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
};

const renameDirsKebab = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await renameDirsKebab(path.join(dir, entry.name));
  }
  const base = path.basename(dir);
  const kebab = toKebab(base);
  if (kebab !== base) {
    const next = path.join(path.dirname(dir), kebab);
    await fs.rename(dir, next);
    return next;
  }
  return dir;
};

const cleanSvgOpenAttrs = (attrs) => {
  let next = attrs;
  next = next.replace(/\s+width="[^"]*"/gi, "");
  next = next.replace(/\s+height="[^"]*"/gi, "");
  next = next.replace(/\s+width=\{[^}]*\}/gi, "");
  next = next.replace(/\s+height=\{[^}]*\}/gi, "");
  next = next.replace(/\s*\{\s*\.\.\.props\s*\}/gi, "");
  next = next.replace(/\s+/g, " ").trim();
  return next;
};

const replaceColors = (body) => {
  const targets = ["#000000", "#000", "black", "#111", "#0"];
  let next = body;
  for (const t of targets) {
    const reFill = new RegExp(`fill="${t}"`, "gi");
    const reStroke = new RegExp(`stroke="${t}"`, "gi");
    next = next.replace(reFill, "fill={color}");
    next = next.replace(reStroke, "stroke={color}");
  }
  return next;
};

const camelizeAttrs = (svg) => {
  let next = svg;
  for (const [from, to] of Object.entries(attrMap)) {
    const re = new RegExp(`\\b${from}=`, "g");
    next = next.replace(re, `${to}=`);
  }
  return next;
};

const svgToTsx = (svg, componentName, title) => {
  const openMatch = svg.match(/<svg([^>]*)>/i);
  const innerMatch = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (!openMatch || !innerMatch) return null;

  const attrs = cleanSvgOpenAttrs(openMatch[1]);
  const inner = innerMatch[1].replace(/<title>[\s\S]*?<\/title>/gi, "").trim();

  const body = replaceColors(camelizeAttrs(inner));
  const svgOpen = attrs
    ? `<svg ${attrs} width={size} height={size} {...props}>`
    : `<svg width={size} height={size} {...props}>`;

  return `import type { IconProps } from "@/icons/types";

export const ${componentName} = ({
  size = 24,
  color = "currentColor",
  ...props
}: IconProps) => (
  ${svgOpen}
    <title>${title}</title>
    ${body}
  </svg>
);
`;
};

const processSvgs = async () => {
  const files = await walk(iconsRoot);
  const mappings = [];

  for (const file of files) {
    if (!file.toLowerCase().endsWith(".svg")) continue;
    const dir = path.dirname(file);
    const base = path.basename(file, ".svg");
    const kebab = toKebab(base.replace(/^icon/i, ""));
    if (!kebab) continue;

    const component = `${toPascal(kebab)}Icon`;
    const title = toTitle(kebab);
    const tsxPath = path.join(dir, `${kebab}.tsx`);

    const raw = await fs.readFile(file, "utf8");
    const tsx = svgToTsx(raw, component, title);
    if (!tsx) continue;

    await fs.writeFile(tsxPath, tsx, "utf8");
    await fs.unlink(file);

    mappings.push({ oldName: toPascal(base), newName: component });
  }

  return mappings;
};

const rewriteIndex = async () => {
  const files = await walk(iconsRoot);
  const exports = files
    .filter((file) => file.endsWith(".tsx"))
    .filter((file) => path.basename(file) !== "index.ts")
    .map((file) => path.relative(iconsRoot, file).replace(/\\/g, "/"))
    .sort((a, b) => a.localeCompare(b));

  const lines = exports.map(
    (rel) => `export * from "./${rel.replace(/\.tsx$/, "")}";`,
  );
  await fs.writeFile(
    path.join(iconsRoot, "index.ts"),
    `${lines.join("\n")}\n`,
    "utf8",
  );
};

const replaceUsages = async (mappings) => {
  if (!updateUsages) return;
  const files = await walk(repoRoot);
  const targets = files.filter((file) => {
    if (file.startsWith(iconsRoot)) return false;
    return /(\.tsx?|\.mdx?|\.mjs|\.js)$/.test(file);
  });

  for (const file of targets) {
    let text = await fs.readFile(file, "utf8");
    let changed = false;
    for (const { oldName, newName } of mappings) {
      if (!oldName || oldName === newName) continue;
      const re = new RegExp(`\\b${oldName}\\b`, "g");
      if (re.test(text)) {
        text = text.replace(re, newName);
        changed = true;
      }
    }
    if (changed) {
      await fs.writeFile(file, text, "utf8");
    }
  }
};

const main = async () => {
  await renameDirsKebab(iconsRoot);
  const mappings = await processSvgs();
  await rewriteIndex();
  await replaceUsages(mappings);
  console.log(
    `Processed ${mappings.length} icons${updateUsages ? " with usage updates" : ""}.`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
