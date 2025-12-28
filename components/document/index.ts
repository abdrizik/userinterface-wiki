export { Breadcrumb } from "./breadcrumb";
export { Content } from "./content";
export { useDocument } from "./context";
export { Footer } from "./footer";
export { Header } from "./header";
export { MediaPlayer } from "./media-player";
export { ReadingProgress } from "./reading-progress";
export { Root } from "./root";
export { TableOfContents } from "./table-of-contents";

export type {
  AgentState,
  AudioStatus,
  PlaybackRate,
  SerializablePageData,
  WordTimestamp,
} from "./types";

export { toSerializablePageData } from "./types";

import { Breadcrumb } from "./breadcrumb";
import { Content } from "./content";
import { Footer } from "./footer";
import { Header } from "./header";
import { MediaPlayer } from "./media-player";
import { ReadingProgress } from "./reading-progress";
// Named exports for backward compatibility
import { Root } from "./root";
import { TableOfContents } from "./table-of-contents";

export {
  Root as DocumentRoot,
  Header as DocumentHeader,
  Content as DocumentContent,
  MediaPlayer as DocumentMediaPlayer,
  Footer as DocumentFooter,
  ReadingProgress as DocumentReadingProgress,
  TableOfContents as DocumentTableOfContents,
  Breadcrumb as DocumentBreadcrumb,
};

export const Document = {
  Root,
  Header,
  Content,
  MediaPlayer,
  Footer,
  ReadingProgress,
  TableOfContents,
  Breadcrumb,
};
