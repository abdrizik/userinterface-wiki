// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"12-principles-of-animation.mdx": () => import("../documents/12-principles-of-animation.mdx?collection=docs"), "ease-vs-springs.mdx": () => import("../documents/ease-vs-springs.mdx?collection=docs"), "sounds-on-the-web.mdx": () => import("../documents/sounds-on-the-web.mdx?collection=docs"), "taking-advantage-of-pseudo-elements.mdx": () => import("../documents/taking-advantage-of-pseudo-elements.mdx?collection=docs"), }),
};
export default browserCollections;