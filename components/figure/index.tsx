"use client";

import { ClipboardCopyIcon, DownloadIcon } from "@radix-ui/react-icons";
import React from "react";

import styles from "./styles.module.css";
import { getRenderablePngBlob } from "./utils";

type FigureProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  downloadable?: boolean;
};

export function Figure({
  children,
  className,
  downloadable = true,
  ...props
}: FigureProps) {
  const figureRef = React.useRef<HTMLElement | null>(null);
  const [isProcessing, setIsProcessing] = React.useState<
    "copy" | "download" | null
  >(null);
  const [hasRenderableContent, setHasRenderableContent] = React.useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: rerun when figure children change
  React.useEffect(() => {
    const node = figureRef.current;
    if (!node) return;
    const hasImg = Boolean(node.querySelector("img"));
    const hasSvg = Boolean(node.querySelector("svg"));
    setHasRenderableContent(hasImg || hasSvg);
  }, [children]);

  const copyAsPng = React.useCallback(async () => {
    setIsProcessing("copy");
    try {
      const node = figureRef.current;
      if (!node) throw new Error("No figure node found.");

      const blob = await getRenderablePngBlob(node);

      if (
        navigator.clipboard &&
        "write" in navigator.clipboard &&
        "ClipboardItem" in window
      ) {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "figure.png";
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to copy PNG", error);
    } finally {
      setIsProcessing(null);
    }
  }, []);

  const downloadPng = React.useCallback(async () => {
    setIsProcessing("download");
    try {
      const node = figureRef.current;
      if (!node) throw new Error("No figure node found.");

      const blob = await getRenderablePngBlob(node);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "figure.png";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PNG", error);
    } finally {
      setIsProcessing(null);
    }
  }, []);

  const isBusy = Boolean(isProcessing);

  return (
    <figure
      ref={figureRef}
      data-prose-type="figure"
      className={[styles.wrapper, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}

      <div
        className={styles.toolbar}
        aria-hidden={!hasRenderableContent}
        data-figure-toolbar="true"
      >
        <button
          type="button"
          className={styles.button}
          onClick={copyAsPng}
          disabled={!hasRenderableContent || isBusy}
          aria-label="Copy figure as PNG"
        >
          <ClipboardCopyIcon />
        </button>
        {downloadable ? (
          <button
            type="button"
            className={styles.button}
            onClick={downloadPng}
            disabled={!hasRenderableContent || isBusy}
            aria-label="Download figure as PNG"
          >
            <DownloadIcon />
          </button>
        ) : null}
      </div>
    </figure>
  );
}

export function Caption({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <figcaption
      data-prose-type="figcaption"
      className={[styles.caption, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
