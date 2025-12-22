import { toPng } from "html-to-image";

const TOOLBAR_SELECTOR = '[data-figure-toolbar="true"]';

export async function getRenderablePngBlob(root: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(root, {
    cacheBust: true,
    pixelRatio: window.devicePixelRatio || 1,
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      return !node.closest(TOOLBAR_SELECTOR);
    },
  });

  const response = await fetch(dataUrl);
  return await response.blob();
}
