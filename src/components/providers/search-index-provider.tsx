"use client";

import { hydrateSiteSearchIndex, type SiteSearchResult } from "@/lib/search";

/**
 * Hydrates the client search index from a server-primed Engine snapshot
 * during render so the first keystroke never hits a cold/empty catalog.
 */
export function SearchIndexProvider({
  index,
  children,
}: {
  index: SiteSearchResult[];
  children: React.ReactNode;
}) {
  hydrateSiteSearchIndex(index);
  return <>{children}</>;
}
