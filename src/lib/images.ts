/**
 * Image helpers — always prefer WebP, low file size, sharp quality.
 * Use these when adding or updating any image URL on the site.
 */

export const IMAGE_QUALITY = 70;
export const IMAGE_FORMAT = "webp" as const;

type OptimizeOptions = {
  /** Target width in px (Unsplash / CDN). Default 1200. */
  width?: number;
  /** Quality 1–100. Default 70 (good quality, small file). */
  quality?: number;
};

/**
 * Normalize remote image URLs (esp. Unsplash) to WebP with constrained size/quality.
 */
export function optimizeImageUrl(url: string, options: OptimizeOptions = {}): string {
  const width = options.width ?? 1200;
  const quality = options.quality ?? IMAGE_QUALITY;

  try {
    const parsed = new URL(url);

    if (parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fm", IMAGE_FORMAT);
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", String(quality));
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

/** Small card / list thumbnails */
export function thumbnailUrl(url: string, width = 320): string {
  return optimizeImageUrl(url, { width, quality: IMAGE_QUALITY });
}

/** Hero / large section images */
export function heroImageUrl(url: string, width = 1600): string {
  return optimizeImageUrl(url, { width, quality: IMAGE_QUALITY });
}
