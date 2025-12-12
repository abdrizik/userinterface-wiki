"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isElementNode,
  $createTextNode,
  type EditorState,
} from "lexical";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { ChipNode, $createChipNode, $isChipNode } from "./lexical/chip-node";
import { SingleLinePlugin, ChipBackspacePlugin } from "./lexical/plugins";
import styles from "./styles.module.css";

// Filter option types
interface FilterOption {
  key: string;
  description: string;
  example: string;
}

// Built-in filter options
const FILTER_OPTIONS: FilterOption[] = [
  { key: "tag", description: "Filter by tag", example: "tag:animation" },
  { key: "author", description: "Filter by author", example: "author:john" },
  {
    key: "before",
    description: "Before a date",
    example: "before:2024-01-01",
  },
  { key: "after", description: "After a date", example: "after:2024-01-01" },
  {
    key: "during",
    description: "During a specific month",
    example: "during:2024-01",
  },
];

const DATE_FILTER_KEYS = ["before", "after", "during"];

function isValidFilterKey(key: string): boolean {
  return FILTER_OPTIONS.some((opt) => opt.key === key);
}

interface ParsedSearch {
  text: string;
  filters: Array<{
    key: string;
    value: string;
    negated: boolean;
  }>;
}

function extractLastWord(text: string): { before: string; word: string } {
  const match = text.match(/^(.*?)(\S+)$/);
  if (match) {
    return { before: match[1], word: match[2] };
  }
  return { before: text, word: "" };
}

function parseFilterFromWord(word: string): {
  key: string;
  value: string;
  negated: boolean;
} | null {
  const match = word.match(/^(-?)(\w+):(.+)$/);
  if (match) {
    const [, neg, key, value] = match;
    if (isValidFilterKey(key)) {
      return { key, value, negated: Boolean(neg) };
    }
  }
  return null;
}

interface TagFilterEditorProps {
  onQueryChange: (parsed: ParsedSearch) => void;
  placeholder?: string;
}

function TagFilterEditor({
  onQueryChange,
  placeholder = "Search...",
}: TagFilterEditorProps) {
  const [editor] = useLexicalComposerContext();
  const [showPopup, setShowPopup] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [matchingOptions, setMatchingOptions] = useState<FilterOption[]>([]);
  const [pendingDateFilter, setPendingDateFilter] = useState<{
    key: string;
    negated: boolean;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [hasContent, setHasContent] = useState(false);

  const getTextContent = useCallback((): string => {
    let text = "";
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChild();
      if (paragraph && $isElementNode(paragraph)) {
        for (const node of paragraph.getChildren()) {
          if ($isTextNode(node)) {
            text += node.getTextContent();
          }
        }
      }
    });
    return text;
  }, [editor]);

  const updateParsedResults = useCallback(() => {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChild();
      const filters: Array<{ key: string; value: string; negated: boolean }> =
        [];
      let text = "";

      if (paragraph && $isElementNode(paragraph)) {
        for (const node of paragraph.getChildren()) {
          if ($isChipNode(node)) {
            filters.push({
              key: node.getChipKey(),
              value: node.getChipValue(),
              negated: node.isNegated(),
            });
          } else if ($isTextNode(node)) {
            text += node.getTextContent();
          }
        }
      }

      onQueryChange({ text: text.trim(), filters });
    });
  }, [editor, onQueryChange]);

  const replaceLastWordWithChip = useCallback(
    (key: string, value: string, negated: boolean) => {
      editor.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild();
        if (!paragraph || !$isElementNode(paragraph)) return;

        const lastChild = paragraph.getLastChild();
        if (!$isTextNode(lastChild)) return;

        const text = lastChild.getTextContent();
        const { before } = extractLastWord(text);

        const chipNode = $createChipNode(key, value, negated);

        if (before.trim()) {
          lastChild.setTextContent(before);
          lastChild.insertAfter(chipNode);
        } else {
          lastChild.replace(chipNode);
        }

        // Add a text node after the chip for continued typing
        const spaceNode = $createTextNode(" ");
        chipNode.insertAfter(spaceNode);
        spaceNode.selectEnd();
      });

      updateParsedResults();
    },
    [editor, updateParsedResults]
  );

  const handleChange = useCallback(
    (_editorState: EditorState) => {
      const textContent = getTextContent();
      setHasContent(textContent.length > 0 || false);

      const { word } = extractLastWord(textContent);

      // Check if word is a complete filter
      const filter = parseFilterFromWord(word);
      if (filter) {
        replaceLastWordWithChip(filter.key, filter.value, filter.negated);
        setShowPopup(false);
        return;
      }

      // Check for date filter prefix (e.g., "before:", "after:", "during:")
      const dateMatch = word.match(/^(-?)(before|after|during):$/);
      if (dateMatch) {
        setPendingDateFilter({
          key: dateMatch[2],
          negated: Boolean(dateMatch[1]),
        });
        setShowPopup(true);
        setMatchingOptions([]);
        return;
      }

      // Reset pending date filter if word doesn't match
      if (pendingDateFilter && !word.includes(":")) {
        setPendingDateFilter(null);
      }

      // Check for partial filter key match
      const partialMatch = word.match(/^(-?)(\w*)$/);
      if (partialMatch?.[2]) {
        const prefix = partialMatch[2].toLowerCase();
        const matches = FILTER_OPTIONS.filter((opt) =>
          opt.key.toLowerCase().startsWith(prefix)
        );
        if (matches.length > 0 && prefix.length >= 1) {
          setMatchingOptions(matches);
          setHighlightedIndex(0);
          setShowPopup(true);
          return;
        }
      }

      setShowPopup(false);
      setMatchingOptions([]);

      // Update parsed results
      updateParsedResults();
    },
    [getTextContent, pendingDateFilter, replaceLastWordWithChip, updateParsedResults]
  );

  const handleSelectFilterOption = useCallback(
    (option: FilterOption) => {
      editor.update(() => {
        const root = $getRoot();
        const paragraph = root.getFirstChild();
        if (!paragraph || !$isElementNode(paragraph)) return;

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const lastChild = paragraph.getLastChild();

        if (!lastChild) {
          // No text node exists, insert filter key directly
          const textNode = $createTextNode(`${option.key}:`);
          selection.insertNodes([textNode]);
          textNode.selectEnd();
          editor.focus();
          return;
        }

        if (!$isTextNode(lastChild)) return;

        const text = lastChild.getTextContent();
        const { before } = extractLastWord(text);

        lastChild.setTextContent(`${before}${option.key}:`);
        lastChild.selectEnd();
      });

      if (DATE_FILTER_KEYS.includes(option.key)) {
        setPendingDateFilter({ key: option.key, negated: false });
        setMatchingOptions([]);
      } else {
        setShowPopup(false);
      }
    },
    [editor]
  );

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date || !pendingDateFilter) return;

      const formattedDate =
        pendingDateFilter.key === "during"
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          : date.toISOString().split("T")[0];

      replaceLastWordWithChip(
        pendingDateFilter.key,
        formattedDate,
        pendingDateFilter.negated
      );
      setPendingDateFilter(null);
      setShowPopup(false);
    },
    [pendingDateFilter, replaceLastWordWithChip]
  );

  const handleClear = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const paragraph = root.getFirstChild();
      if (paragraph && $isElementNode(paragraph)) {
        paragraph.clear();
      }
    });
    setShowPopup(false);
    setPendingDateFilter(null);
    onQueryChange({ text: "", filters: [] });
  }, [editor, onQueryChange]);

  const handleChipUnwrap = useCallback(
    (_rawText: string) => {
      updateParsedResults();
    },
    [updateParsedResults]
  );

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowPopup(false);
        setPendingDateFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPopup || pendingDateFilter) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < matchingOptions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : matchingOptions.length - 1
        );
      } else if (e.key === "Tab" && matchingOptions.length > 0) {
        e.preventDefault();
        handleSelectFilterOption(matchingOptions[highlightedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    showPopup,
    highlightedIndex,
    matchingOptions,
    handleSelectFilterOption,
    pendingDateFilter,
  ]);

  return (
    <div ref={containerRef} className={styles.search}>
      <svg
        className={styles.icon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
          stroke="currentColor"
          strokeWidth="1.333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className={styles.wrapper}>
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              ref={inputRef}
              className={styles.contenteditable}
              data-placeholder={placeholder}
            />
          }
          ErrorBoundary={({ children }) => <>{children}</>}
        />
        {!hasContent && (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
      </div>

      <OnChangePlugin onChange={handleChange} />
      <HistoryPlugin />
      <SingleLinePlugin />
      <ChipBackspacePlugin onChipUnwrap={handleChipUnwrap} />

      {hasContent && (
        <button
          type="button"
          onClick={handleClear}
          className={styles.clear}
          aria-label="Clear search"
        >
          ×
        </button>
      )}

      {showPopup && (
        <div className={styles.popup}>
          {pendingDateFilter ? (
            <>
              <div className={styles.popupheader}>
                <span className={styles.label}>
                  Select {pendingDateFilter.key} date
                </span>
              </div>
              <div className={styles.datepicker}>
                <DayPicker
                  mode="single"
                  onSelect={handleDateSelect}
                  defaultMonth={new Date()}
                />
              </div>
            </>
          ) : (
            <>
              <div className={styles.popupheader}>
                <span className={styles.label}>Search filters</span>
                <span className={styles.hint}>
                  <kbd>Tab</kbd> to select
                </span>
              </div>
              <div className={styles.list}>
                {matchingOptions.map((option, index) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`${styles.option} ${index === highlightedIndex ? styles.highlighted : ""}`}
                    onClick={() => handleSelectFilterOption(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className={styles.optionkey}>{option.key}:</span>
                    <span className={styles.optiondesc}>
                      {option.description}
                    </span>
                    <span className={styles.optionexample}>
                      {option.example}
                    </span>
                  </button>
                ))}
              </div>
              <div className={styles.popupfooter}>
                <span className={styles.tip}>
                  Use <code>-</code> prefix to exclude, e.g.{" "}
                  <code>-tag:draft</code>
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export interface SearchProps {
  onQueryChange: (parsed: ParsedSearch) => void;
  placeholder?: string;
  className?: string;
}

export function Search({
  onQueryChange,
  placeholder = "Search...",
  className,
}: SearchProps) {
  const initialConfig = {
    namespace: "Search",
    nodes: [ChipNode],
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
  };

  return (
    <div className={className}>
      <LexicalComposer initialConfig={initialConfig}>
        <TagFilterEditor
          onQueryChange={onQueryChange}
          placeholder={placeholder}
        />
      </LexicalComposer>
    </div>
  );
}

export type { ParsedSearch, FilterOption };
