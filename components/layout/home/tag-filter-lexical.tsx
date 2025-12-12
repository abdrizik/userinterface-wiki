"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { clsx } from "clsx";
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  type EditorState,
  KEY_BACKSPACE_COMMAND,
} from "lexical";
import Link from "next/link";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { Code } from "@/components/icons";
import { SearchIcon } from "@/components/icons/search";
import {
  matchesQuery,
  parseSearchQuery,
  type SearchQuery,
  type SortOrder,
  sortPages,
} from "@/lib/search";

import {
  $createChipNode,
  $isChipNode,
  ChipNode,
  type ChipPayload,
} from "./lexical/chip-node";
import { SingleLinePlugin } from "./lexical/plugins";
import styles from "./styles.module.css";

export interface SerializedPage {
  url: string;
  title: string;
  description: string;
  tags: string[];
  author: {
    name: string;
  };
  date: {
    published: string;
  };
}

interface FilterOption {
  key: string;
  label: string;
  description: string;
  example?: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    key: "tag:",
    label: "tag:",
    description: "Filter by tag",
    example: "tag:animation",
  },
  {
    key: "author:",
    label: "author:",
    description: "Filter by author",
    example: "author:John",
  },
  {
    key: "before:",
    label: "before:",
    description: "Published before date",
    example: "before:2024-01-01",
  },
  {
    key: "after:",
    label: "after:",
    description: "Published after date",
    example: "after:2024-01-01",
  },
  {
    key: "during:",
    label: "during:",
    description: "Published on exact date",
    example: "during:2024-06-15",
  },
  {
    key: "sort:",
    label: "sort:",
    description: "Sort results",
    example: "sort:oldest",
  },
];

interface TagFilterProps {
  pages: SerializedPage[];
  allTags: string[];
}

// Inner editor component that has access to Lexical context
function TagFilterEditor({ pages, allTags }: TagFilterProps) {
  const [editor] = useLexicalComposerContext();
  const [textContent, setTextContent] = React.useState("");
  const [chips, setChips] = React.useState<ChipPayload[]>([]);
  const [showOptions, setShowOptions] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Track editor state changes
  const handleEditorChange = React.useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();

      // Get plain text (excluding chips)
      let text = "";
      const chipList: ChipPayload[] = [];

      const traverse = (
        node:
          | ReturnType<typeof $getRoot>
          | ReturnType<typeof root.getChildren>[number],
      ) => {
        if ($isChipNode(node)) {
          chipList.push({
            type: node.getChipType(),
            value: node.getValue(),
            negated: node.isNegated(),
          });
        } else if ($isTextNode(node)) {
          text += node.getTextContent();
        } else if ("getChildren" in node) {
          for (const child of (
            node as ReturnType<typeof $getRoot>
          ).getChildren()) {
            traverse(child);
          }
        }
      };

      traverse(root);
      setTextContent(text);
      setChips(chipList);
    });
  }, []);

  // Build a SearchQuery from chips + current text
  const query: SearchQuery = React.useMemo(() => {
    const inputQuery = parseSearchQuery(textContent);
    const textTerms = [...inputQuery.text];
    const result: SearchQuery = { text: textTerms };

    const positiveTags: string[] = [];
    const negativeTags: string[] = [];
    let author: string | undefined;
    let negAuthor: string | undefined;
    let sort: SortOrder | undefined;
    let before: number | undefined;
    let after: number | undefined;
    let during: { start: number; end: number } | undefined;

    for (const chip of chips) {
      switch (chip.type) {
        case "tag":
          if (chip.negated) {
            negativeTags.push(chip.value);
          } else {
            positiveTags.push(chip.value);
          }
          break;
        case "author":
          if (chip.negated) {
            negAuthor = chip.value;
          } else {
            author = chip.value;
          }
          break;
        case "sort":
          sort = chip.value as SortOrder;
          break;
        case "before":
          before = new Date(chip.value).getTime() / 1000;
          break;
        case "after":
          after = new Date(chip.value).getTime() / 1000;
          break;
        case "during": {
          const start = new Date(chip.value).getTime() / 1000;
          during = { start, end: start + 86400 };
          break;
        }
      }
    }

    // Merge with any filters from current input
    if (inputQuery.tags) positiveTags.push(...inputQuery.tags);
    if (inputQuery.not?.tags) negativeTags.push(...inputQuery.not.tags);
    if (inputQuery.author) author = inputQuery.author;
    if (inputQuery.not?.author) negAuthor = inputQuery.not.author;
    if (inputQuery.sort) sort = inputQuery.sort;
    if (inputQuery.date?.before) before = inputQuery.date.before;
    if (inputQuery.date?.after) after = inputQuery.date.after;
    if (inputQuery.date?.during) during = inputQuery.date.during;

    if (positiveTags.length > 0) result.tags = positiveTags;
    if (author) result.author = author;
    if (sort) result.sort = sort;
    if (before || after || during) {
      result.date = {};
      if (before) result.date.before = before;
      if (after) result.date.after = after;
      if (during) result.date.during = during;
    }
    if (negativeTags.length > 0 || negAuthor) {
      result.not = {};
      if (negativeTags.length > 0) result.not.tags = negativeTags;
      if (negAuthor) result.not.author = negAuthor;
    }

    return result;
  }, [chips, textContent]);

  const sortOrder: SortOrder = query.sort ?? "newest";

  // Filter and sort pages
  const filteredPages = React.useMemo(() => {
    const filtered = pages.filter((page) => matchesQuery(page, query));
    return sortPages(filtered, sortOrder);
  }, [pages, query, sortOrder]);

  // Replace the last word with a chip
  const replaceLastWordWithChip = React.useCallback(
    (type: ChipPayload["type"], value: string, negated: boolean) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        if ($isTextNode(anchorNode)) {
          const text = anchorNode.getTextContent();
          const offset = anchor.offset;

          // Find the start of the last word
          let wordStart = offset;
          while (wordStart > 0 && text[wordStart - 1] !== " ") {
            wordStart--;
          }

          // Get text before the word
          const beforeWord = text.slice(0, wordStart);
          const afterWord = text.slice(offset);

          // Replace the text node content
          anchorNode.setTextContent(beforeWord);

          // Insert chip after the remaining text
          const chipNode = $createChipNode({ type, value, negated });

          if (beforeWord) {
            anchorNode.insertAfter(chipNode);
          } else {
            // If no text before, we need to handle differently
            const parent = anchorNode.getParent();
            if (parent) {
              anchorNode.remove();
              parent.append(chipNode);
            }
          }

          // Add remaining text or space
          const afterNode = $createTextNode(afterWord || " ");
          chipNode.insertAfter(afterNode);
          afterNode.select(afterWord ? 0 : 1, afterWord ? 0 : 1);
        }
      });
    },
    [editor],
  );

  // Clear everything
  const clearAll = React.useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const firstChild = root.getFirstChild();
      if (firstChild && $isParagraphNode(firstChild)) {
        firstChild.select();
      }
    });
  }, [editor]);

  // Get last word for suggestions
  const lastWord = React.useMemo(() => {
    const trimmed = textContent.trimEnd();
    return trimmed.split(" ").pop() || "";
  }, [textContent]);

  const lastWordLower = lastWord.toLowerCase();
  const isNegated = lastWordLower.startsWith("-");
  const checkWord = isNegated ? lastWordLower.slice(1) : lastWordLower;

  // Get suggestions based on current input
  const suggestions = React.useMemo(() => {
    // Check for filter value suggestions
    if (checkWord.startsWith("tag:")) {
      const tagQuery = checkWord.slice(4).toLowerCase();
      const matchingTags = allTags.filter((tag) =>
        tag.toLowerCase().includes(tagQuery),
      );
      return {
        type: "tags" as const,
        prefix: isNegated ? "-tag:" : "tag:",
        items: matchingTags,
      };
    }

    if (checkWord.startsWith("author:")) {
      const authorQuery = checkWord.slice(7).toLowerCase();
      const authors = [...new Set(pages.map((p) => p.author.name))];
      const matchingAuthors = authors.filter((a) =>
        a.toLowerCase().includes(authorQuery),
      );
      return {
        type: "authors" as const,
        prefix: isNegated ? "-author:" : "author:",
        items: matchingAuthors,
      };
    }

    if (checkWord.startsWith("sort:")) {
      const sortQuery = checkWord.slice(5).toLowerCase();
      const sortOptions = ["newest", "oldest", "relevance"].filter((opt) =>
        opt.includes(sortQuery),
      );
      return {
        type: "sort" as const,
        prefix: "sort:",
        items: sortOptions,
      };
    }

    // Date filters - show date picker
    if (
      checkWord.startsWith("before:") ||
      checkWord.startsWith("after:") ||
      checkWord.startsWith("during:")
    ) {
      let dateType: "before" | "after" | "during" = "during";
      if (checkWord.startsWith("before:")) dateType = "before";
      else if (checkWord.startsWith("after:")) dateType = "after";

      return {
        type: "date" as const,
        dateType,
        isNegated,
      };
    }

    // Show filter options when empty or typing a partial filter keyword
    if (
      !lastWord ||
      (!checkWord.includes(":") &&
        FILTER_OPTIONS.some((opt) =>
          opt.key.slice(0, -1).startsWith(checkWord),
        ))
    ) {
      const matchingOptions = FILTER_OPTIONS.filter(
        (opt) => !checkWord || opt.key.toLowerCase().startsWith(checkWord),
      );
      return {
        type: "options" as const,
        items: matchingOptions,
      };
    }

    return null;
  }, [checkWord, isNegated, lastWord, allTags, pages]);

  // Handle chip selection from suggestions
  const handleSelectSuggestion = React.useCallback(
    (item: string, type: ChipPayload["type"]) => {
      replaceLastWordWithChip(type, item, isNegated);
      setShowOptions(false);
    },
    [replaceLastWordWithChip, isNegated],
  );

  // Handle filter option selection (just appends the prefix)
  const handleSelectFilterOption = React.useCallback(
    (option: FilterOption) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        if ($isTextNode(anchorNode)) {
          const text = anchorNode.getTextContent();
          const offset = anchor.offset;

          // Find the start of the last word
          let wordStart = offset;
          while (wordStart > 0 && text[wordStart - 1] !== " ") {
            wordStart--;
          }

          // Replace current partial word with full filter prefix
          const beforeWord = text.slice(0, wordStart);
          anchorNode.setTextContent(beforeWord + option.key);
          anchorNode.select(beforeWord.length + option.key.length);
        } else {
          // No text node yet - insert the filter prefix at the selection point
          const textNode = $createTextNode(option.key);
          selection.insertNodes([textNode]);
          textNode.select(option.key.length);
        }
      });
      editor.focus();
    },
    [editor],
  );

  // Keyboard navigation for suggestions
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!showOptions || !suggestions) return;

      // Skip for date picker
      if (suggestions.type === "date") {
        if (e.key === "Escape") {
          setShowOptions(false);
        }
        return;
      }

      const itemCount = suggestions.items?.length ?? 0;
      if (itemCount === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => (i + 1) % itemCount);
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => (i - 1 + itemCount) % itemCount);
          break;
        case "Tab":
        case "Enter":
          e.preventDefault();
          if (suggestions.type === "options") {
            const option = suggestions.items[highlightedIndex];
            if (option) handleSelectFilterOption(option);
          } else if ("items" in suggestions && suggestions.items) {
            const item = suggestions.items[highlightedIndex];
            if (item) {
              let chipType: ChipPayload["type"] = "tag";
              if (checkWord.startsWith("author:")) chipType = "author";
              else if (checkWord.startsWith("sort:")) chipType = "sort";
              handleSelectSuggestion(item, chipType);
            }
          }
          break;
        case "Escape":
          setShowOptions(false);
          break;
      }
    },
    [
      showOptions,
      suggestions,
      highlightedIndex,
      checkWord,
      handleSelectFilterOption,
      handleSelectSuggestion,
    ],
  );

  // Register backspace handler for chips
  React.useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        // Check if we're at the start of a text node with chip before
        if ($isTextNode(anchorNode) && anchor.offset === 0) {
          const prevSibling = anchorNode.getPreviousSibling();
          if ($isChipNode(prevSibling)) {
            event?.preventDefault();
            const chipText = prevSibling.getTextContent();
            prevSibling.remove();
            const textNode = $createTextNode(chipText);
            anchorNode.insertBefore(textNode);
            textNode.select(chipText.length, chipText.length);
            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        editorRef.current &&
        !editorRef.current.contains(e.target as Node)
      ) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight when text changes
  const prevTextRef = React.useRef(textContent);
  if (prevTextRef.current !== textContent) {
    prevTextRef.current = textContent;
    if (highlightedIndex !== 0) {
      setHighlightedIndex(0);
    }
  }

  const hasContent = textContent.trim().length > 0 || chips.length > 0;

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: editor wrapper */}
      <div
        className={styles.search}
        onClick={() => editor.focus()}
        onKeyDown={handleKeyDown}
      >
        <SearchIcon className={styles.icon} size={18} />

        <div ref={editorRef} className={styles.wrapper}>
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                className={styles.contenteditable}
                onFocus={() => setShowOptions(true)}
              />
            }
            placeholder={
              <div className={styles.placeholder}>Search articles…</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleEditorChange} />
          <HistoryPlugin />
          <SingleLinePlugin />
        </div>

        {hasContent && (
          <button
            type="button"
            className={styles.clear}
            onClick={clearAll}
            aria-label="Clear search"
          >
            ×
          </button>
        )}

        {showOptions && suggestions && (
          <div ref={popupRef} className={styles.popup}>
            <div className={styles.popupheader}>
              <span className={styles.label}>Search Filters</span>
              <span className={styles.hint}>
                <kbd>↑</kbd> <kbd>↓</kbd> to navigate · <kbd>Tab</kbd> to select
                · <kbd>Esc</kbd> to close
              </span>
            </div>

            {suggestions.type === "options" && (
              <div className={styles.list}>
                {suggestions.items.map((option, index) => (
                  <button
                    type="button"
                    key={option.key}
                    className={clsx(
                      styles.option,
                      index === highlightedIndex && styles.highlighted,
                    )}
                    onClick={() => handleSelectFilterOption(option)}
                  >
                    <span className={styles.optionkey}>{option.label}</span>
                    <span className={styles.optiondesc}>
                      {option.description}
                    </span>
                    {option.example && (
                      <span className={styles.optionexample}>
                        {option.example}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {(suggestions.type === "tags" ||
              suggestions.type === "authors" ||
              suggestions.type === "sort") && (
              <>
                <div className={styles.category}>
                  {suggestions.type === "tags"
                    ? "Tags"
                    : suggestions.type === "authors"
                      ? "Authors"
                      : "Sort Options"}
                </div>
                <div className={styles.list}>
                  {suggestions.items.length === 0 ? (
                    <div className={styles.empty}>No matches found</div>
                  ) : (
                    suggestions.items.map((item, index) => (
                      <button
                        type="button"
                        key={item}
                        className={clsx(
                          styles.option,
                          index === highlightedIndex && styles.highlighted,
                        )}
                        onClick={() => {
                          let chipType: ChipPayload["type"] = "tag";
                          if (checkWord.startsWith("author:"))
                            chipType = "author";
                          else if (checkWord.startsWith("sort:"))
                            chipType = "sort";
                          handleSelectSuggestion(item, chipType);
                        }}
                      >
                        <span className={styles.optionkey}>{item}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {suggestions.type === "date" && (
              <div className={styles.datepicker}>
                <DayPicker
                  mode="single"
                  onSelect={(date) => {
                    if (date) {
                      const formatted = date.toISOString().split("T")[0];
                      replaceLastWordWithChip(
                        suggestions.dateType,
                        formatted,
                        suggestions.isNegated,
                      );
                      setShowOptions(false);
                      editor.focus();
                    }
                  }}
                />
              </div>
            )}

            <div className={styles.popupfooter}>
              <span className={styles.tip}>
                Use <code>-</code> to exclude: <code>-tag:draft</code> · Quotes
                for spaces: <code>author:"John Doe"</code>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.resultcount}>
        {filteredPages.length}{" "}
        {filteredPages.length === 1 ? "article" : "articles"}
      </div>

      <div className={styles.posts}>
        {filteredPages.length === 0 ? (
          <div className={styles.noresults}>
            <p>No articles match your search.</p>
            <button
              type="button"
              onClick={clearAll}
              className={styles.clearbutton}
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredPages.map((page) => (
            <Link
              key={page.url}
              href={{ pathname: page.url }}
              className={clsx(styles.post)}
            >
              <div className={styles.details}>
                <div className={styles.preview}>
                  <Code />
                </div>
                <div>
                  <h2 className={styles.cardtitle}>{page.title}</h2>
                  <span className={styles.meta}>
                    <span>{page.author.name}</span>
                    <span className={styles.separator} />
                    <span>{page.date.published}</span>
                  </span>
                </div>
              </div>
              <div>
                <p className={styles.description}>{page.description}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}

// Lexical theme for styling
const theme = {
  paragraph: styles.paragraph,
};

// Error handler
function onError(error: Error) {
  console.error("Lexical error:", error);
}

// Main component with Lexical provider
export const TagFilter = ({ pages, allTags }: TagFilterProps) => {
  const initialConfig = {
    namespace: "TagFilter",
    theme,
    onError,
    nodes: [ChipNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <TagFilterEditor pages={pages} allTags={allTags} />
    </LexicalComposer>
  );
};
