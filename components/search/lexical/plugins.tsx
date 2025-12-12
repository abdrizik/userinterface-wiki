"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isElementNode,
  $createTextNode,
  COMMAND_PRIORITY_CRITICAL,
  KEY_ENTER_COMMAND,
  KEY_BACKSPACE_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { $isChipNode, type ChipNode } from "./chip-node";

export function SingleLinePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => true,
      COMMAND_PRIORITY_CRITICAL
    );

    const unregisterLineBreak = editor.registerCommand(
      INSERT_LINE_BREAK_COMMAND,
      () => true,
      COMMAND_PRIORITY_CRITICAL
    );

    const unregisterParagraph = editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      () => true,
      COMMAND_PRIORITY_CRITICAL
    );

    return () => {
      unregisterEnter();
      unregisterLineBreak();
      unregisterParagraph();
    };
  }, [editor]);

  return null;
}

interface ChipBackspacePluginProps {
  onChipUnwrap: (rawText: string) => void;
}

export function ChipBackspacePlugin({ onChipUnwrap }: ChipBackspacePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;

        // Case 1: Cursor is directly on the chip node (when navigating with arrows)
        if ($isChipNode(anchorNode)) {
          event?.preventDefault();
          const chipNode = anchorNode as ChipNode;
          const rawText = chipNode.getRawText();
          const textNode = $createTextNode(rawText);
          anchorNode.replace(textNode);
          textNode.selectEnd();
          onChipUnwrap(rawText);
          return true;
        }

        // Case 2: Check if we're in a text node
        if (!$isTextNode(anchorNode)) {
          return false;
        }

        // If we're not at the start of the text node, let default behavior handle it
        if (anchorOffset !== 0) {
          return false;
        }

        // Case 3: We're at offset 0 in a text node, check if previous sibling is a chip
        const previousSibling = anchorNode.getPreviousSibling();
        if (previousSibling && $isChipNode(previousSibling)) {
          event?.preventDefault();
          const chipNode = previousSibling as ChipNode;
          const rawText = chipNode.getRawText();
          const textNode = $createTextNode(rawText);
          previousSibling.replace(textNode);
          textNode.selectEnd();
          onChipUnwrap(rawText);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, onChipUnwrap]);

  return null;
}

interface ChipData {
  key: string;
  value: string;
  negated: boolean;
  rawText: string;
}

export function useEditorChips(): ChipData[] {
  const [editor] = useLexicalComposerContext();
  const chips: ChipData[] = [];

  editor.getEditorState().read(() => {
    const root = $getRoot();
    const firstParagraph = root.getFirstChild();
    if (!firstParagraph || !$isElementNode(firstParagraph)) return;

    const children = firstParagraph.getChildren();
    for (const child of children) {
      if ($isChipNode(child)) {
        const chipNode = child as ChipNode;
        chips.push({
          key: chipNode.getChipKey(),
          value: chipNode.getChipValue(),
          negated: chipNode.isNegated(),
          rawText: chipNode.getRawText(),
        });
      }
    }
  });

  return chips;
}
