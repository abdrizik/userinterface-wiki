import type { Element, Root } from "hast";
import type { Pluggable } from "unified";
import { visit } from "unist-util-visit";

const TYPE_MAP: Record<string, string> = {
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  p: "text",
  li: "text",
  ul: "list",
  ol: "list",
};

const DEFAULT_TYPE = "block";

export const rehypeProseTypePlugin: Pluggable = () => {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!node.tagName) return;

      const existingType = node.properties?.["data-prose-type"];
      if (typeof existingType === "string" && existingType.length > 0) {
        return;
      }

      const proseType = TYPE_MAP[node.tagName.toLowerCase()] ?? DEFAULT_TYPE;

      node.properties = {
        ...node.properties,
        "data-prose-type": proseType,
      };
    });
  };
};
