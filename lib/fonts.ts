/**
 * Font configuration
 */

import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

const inter = Inter({
  variable: "--font-family-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-family-monospace",
  subsets: ["latin"],
});

const newYork = localFont({
  variable: "--font-family-serif",
  src: "../public/fonts/new-york/new-york.ttf",
  display: "swap",
});

const lfe = localFont({
  variable: "--font-family-lfe",
  src: [
    { path: "../public/fonts/lfe/regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/lfe/medium.ttf", weight: "500", style: "normal" },
    {
      path: "../public/fonts/lfe/semi-bold.ttf",
      weight: "600",
      style: "normal",
    },
    { path: "../public/fonts/lfe/bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export const fonts = [
  inter.variable,
  jetbrainsMono.variable,
  newYork.variable,
  lfe.variable,
].join(" ");
