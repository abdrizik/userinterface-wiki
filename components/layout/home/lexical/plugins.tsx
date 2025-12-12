"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND,
} from "lexical";
import { useCallback, useEffect } from "react";
import { $isChipNode, type ChipNode } from "./chip-node";

/**
 * Plugin that handles backspace on chip nodes:
 * When the cursor is right after a chip and backspace is pressed,
 * convert the chip back to editable text.
 */
export function ChipBackspacePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        // Case 1: Cursor is directly on a chip node (selection anchor is the chip)
        if ($isChipNode(anchorNode)) {
          event?.preventDefault();
          const chipText = anchorNode.getTextContent();
          const textNode = $createTextNode(chipText);
          anchorNode.replace(textNode);
          textNode.select(chipText.length, chipText.length);
          return true;
        }

        // Case 2: We're at the start of a text node, check previous sibling
        if ($isTextNode(anchorNode) && anchor.offset === 0) {
          const prevSibling = anchorNode.getPreviousSibling();
          if ($isChipNode(prevSibling)) {
            event?.preventDefault();

            // Get the text representation of the chip
            const chipText = prevSibling.getTextContent();

            // Remove the chip and insert its text content
            prevSibling.remove();

            // Insert the chip text at the current position
            const textNode = $createTextNode(chipText);
            anchorNode.insertBefore(textNode);

            // Move selection to end of inserted text
            textNode.select(chipText.length, chipText.length);

            return true;
          }
        }

        // Case 3: Check if we're directly after a chip in the parent's children
        if (anchor.offset === 0) {
          const parent = anchorNode.getParent();
          if (parent) {
            const children = parent.getChildren();
            const nodeIndex = children.indexOf(anchorNode);

            if (nodeIndex > 0) {
              const prevNode = children[nodeIndex - 1];
              if ($isChipNode(prevNode)) {
                event?.preventDefault();
                const chipText = prevNode.getTextContent();
                prevNode.remove();

                const textNode = $createTextNode(chipText);
                anchorNode.insertBefore(textNode);
                textNode.select(chipText.length, chipText.length);

                return true;
              }
            }
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

/**
 * Hook to get all chips from the editor
 */
export function useEditorChips(): ChipNode[] {
  const [editor] = useLexicalComposerContext();

  const getChips = useCallback(() => {
    let chips: ChipNode[] = [];
    editor.getEditorState().read(() => {
      const root = $getRoot();
      chips = [];

      // Helper to traverse
      const traverse = (node: ReturnType<typeof $getRoot>) => {
        const children = node.getChildren();
        for (const child of children) {
          if ($isChipNode(child)) {
            chips.push(child);
          }
          if ("getChildren" in child) {
            traverse(child as ReturnType<typeof $getRoot>);
          }
        }
      };
      traverse(root);
    });
    return chips;
  }, [editor]);

  return getChips();
}

/**
 * Plugin that prevents Enter from creating new lines.
 * Keeps the editor as a single-line input.
 */
export function SingleLinePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Block Enter key
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        event?.preventDefault();
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    // Block line break insertion
    const unregisterLineBreak = editor.registerCommand(
      INSERT_LINE_BREAK_COMMAND,
      () => true,
      COMMAND_PRIORITY_CRITICAL,
    );

    // Block paragraph insertion
    const unregisterParagraph = editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      () => true,
      COMMAND_PRIORITY_CRITICAL,
    );

    return () => {
      unregisterEnter();
      unregisterLineBreak();
      unregisterParagraph();
    };
  }, [editor]);

  return null;
}
