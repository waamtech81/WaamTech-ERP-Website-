import { Inter, Poppins } from "next/font/google";

/**
 * Centralized enterprise typography fonts (Next.js optimized).
 * - Headings: Poppins 600–700
 * - Body: Inter 400–500
 * font-display: swap avoids invisible text during load (no FOIT).
 */
export const fontHeading = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const fontBody = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

/** Combined className for `<html>` — registers CSS variables for both families. */
export const fontVariablesClassName = `${fontHeading.variable} ${fontBody.variable}`;
