import { Plus_Jakarta_Sans, Source_Sans_3 } from "next/font/google";

/**
 * Version 2 typography — distinctive enterprise pairing (not Inter/Poppins template defaults).
 * CSS variable names kept for globals.css compatibility.
 * - Display / headings: Plus Jakarta Sans
 * - Body / UI: Source Sans 3
 */
export const fontHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const fontBody = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

/** Combined className for `<html>` — registers CSS variables for both families. */
export const fontVariablesClassName = `${fontHeading.variable} ${fontBody.variable}`;
