import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-family-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-family-monospace",
  subsets: ["latin"],
});

export const fonts = [inter.variable, jetbrainsMono.variable];
