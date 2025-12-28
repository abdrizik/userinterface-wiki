"use client";

import { createContext, useContext } from "react";
import type { DocumentContextValue } from "./types";

export const DocumentContext = createContext<DocumentContextValue | null>(null);

export function useDocumentContext(
  componentName: string,
): DocumentContextValue {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error(
      `<Document.${componentName}> must be used within <Document.Root>`,
    );
  }
  return context;
}

export function useDocument(): DocumentContextValue {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocument must be used within <Document.Root>");
  }
  return context;
}
