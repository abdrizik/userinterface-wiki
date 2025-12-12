"use client";

import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  type LexicalEditor,
} from "lexical";
import * as React from "react";

import { $createChipNode } from "../../internals/chip-node";
import type { ChipPayload } from "../../types";

/**
 * Hook that provides a function to replace the last typed word with a chip.
 * Used for converting typed filter prefixes (e.g., "tag:react") into visual chips.
 */
export function useChipInsertion(
  editorRef: React.RefObject<LexicalEditor | null>,
) {
  const replaceLastWordWithChip = React.useCallback(
    (type: ChipPayload["type"], value: string, negated: boolean) => {
      const editor = editorRef.current;
      if (!editor) return;

      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        if ($isTextNode(anchorNode)) {
          const text = anchorNode.getTextContent();
          const offset = anchor.offset;

          // Find word start
          let wordStart = offset;
          while (wordStart > 0 && text[wordStart - 1] !== " ") {
            wordStart--;
          }

          const beforeWord = text.slice(0, wordStart);
          const afterWord = text.slice(offset);

          // Update text content
          anchorNode.setTextContent(beforeWord);

          // Create and insert chip
          const chipNode = $createChipNode({ type, value, negated });

          if (beforeWord) {
            anchorNode.insertAfter(chipNode);
          } else {
            const parent = anchorNode.getParent();
            if (parent) {
              anchorNode.remove();
              parent.append(chipNode);
            }
          }

          // Add text after chip and set cursor
          const afterNode = $createTextNode(afterWord || " ");
          chipNode.insertAfter(afterNode);
          afterNode.select(afterWord ? 0 : 1, afterWord ? 0 : 1);
        }
      });
    },
    [editorRef],
  );

  return { replaceLastWordWithChip };
}
