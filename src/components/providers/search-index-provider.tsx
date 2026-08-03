"use client";

import { useEffect } from "react";
import {
  ensureSiteSearchIndexComplete,
  hydrateSiteSearchIndex,
  isEngineBackedSearchIndex,
  type SiteSearchResult,
} from "@/lib/search";

/**
 * Hydrates the client search index from a server-primed snapshot during render.
 * If the SSR seed is products-only (cold Engine), completes industries/categories
 * in the background via existing website commercial BFF routes.
 */
export function SearchIndexProvider({
  index,
  children,
}: {
  index: SiteSearchResult[];
  children: React.ReactNode;
}) {
  hydrateSiteSearchIndex(index);

  useEffect(() => {
    if (isEngineBackedSearchIndex(index)) return;
    let cancelled = false;
    void ensureSiteSearchIndexComplete().catch(() => {
      if (!cancelled) {
        // Keep the products seed; next navigation/retry can complete.
      }
    });
    return () => {
      cancelled = true;
    };
  }, [index]);

  return <>{children}</>;
}
