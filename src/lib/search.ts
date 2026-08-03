import { products } from "@/lib/data/site";
import {
  getIndustryLucideIcon,
  getIndustryPresentation,
} from "@/lib/data/business-hierarchy";
import {
  buildPublicCatalogFromRows,
  loadEngineCatalogBundle,
  type PublicCategory,
  type PublicIndustry,
} from "@/lib/commercial/engine-industry-ssot";
import type {
  CatalogBusinessCategory,
  CatalogIndustry,
} from "@/lib/commercial/types";

export type SiteSearchResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  type: "Product" | "Industry" | "Category";
  icon: string;
  color?: string;
  meta?: string;
};

let cachedIndex: SiteSearchResult[] | null = null;
let cachePromise: Promise<SiteSearchResult[]> | null = null;
let completePromise: Promise<SiteSearchResult[]> | null = null;

function buildIndexFromEngine(
  industries: PublicIndustry[],
  categories: PublicCategory[]
): SiteSearchResult[] {
  const productItems: SiteSearchResult[] = products.map((p) => ({
    id: `product:${p.id}`,
    title: p.name,
    description: p.tagline,
    href: `/products#${p.slug}`,
    type: "Product",
    icon: p.icon,
    meta: p.category,
  }));

  const industryById = new Map(industries.map((i) => [i.id, i]));

  const industryItems: SiteSearchResult[] = industries.map((ind) => {
    const presentation = getIndustryPresentation(ind.id);
    return {
      id: `industry:${ind.id}`,
      title: ind.name,
      description: ind.description,
      href: `/industries/${ind.id}`,
      type: "Industry" as const,
      icon: getIndustryLucideIcon({ id: ind.id, icon: ind.icon || presentation.icon }),
      color: presentation.color,
    };
  });

  const categoryItems: SiteSearchResult[] = categories.map((cat) => {
    const industry = industryById.get(cat.industry_id);
    const presentation = getIndustryPresentation(industry?.id || cat.industry_id);
    return {
      id: `category:${cat.id}`,
      title: cat.name,
      description: industry ? `${industry.name} category` : "Business category",
      href: `/signup/${(industry?.id || cat.industry_id).replace(/_/g, "-")}/${cat.id.replace(/_/g, "-")}`,
      type: "Category" as const,
      icon: "Boxes",
      color: presentation.color,
      meta: industry?.name,
    };
  });

  return [...productItems, ...industryItems, ...categoryItems];
}

/** True when industries and/or categories arrived from Engine/catalog (not products-only seed). */
export function isEngineBackedSearchIndex(
  index: SiteSearchResult[] | null | undefined
): boolean {
  return Boolean(index?.some((i) => i.type === "Industry" || i.type === "Category"));
}

/** Hydrate sync cache from a server-primed Engine index (no extra API call). */
export function hydrateSiteSearchIndex(index: SiteSearchResult[]): void {
  if (!Array.isArray(index) || !index.length) return;
  // Never replace a complete Engine-backed index with a products-only seed.
  if (isEngineBackedSearchIndex(cachedIndex) && !isEngineBackedSearchIndex(index)) {
    return;
  }
  cachedIndex = index;
  cachePromise = Promise.resolve(index);
  if (isEngineBackedSearchIndex(index)) {
    completePromise = Promise.resolve(index);
  }
}

export async function buildSiteSearchIndexFromEngine(): Promise<SiteSearchResult[]> {
  if (isEngineBackedSearchIndex(cachedIndex)) return cachedIndex as SiteSearchResult[];
  if (!cachePromise || !isEngineBackedSearchIndex(cachedIndex)) {
    cachePromise = (async () => {
      const bundle = await loadEngineCatalogBundle();
      cachedIndex = buildIndexFromEngine(bundle.industries, bundle.categories);
      return cachedIndex;
    })();
  }
  return cachePromise;
}

export function getSiteSearchIndex(): SiteSearchResult[] {
  return cachedIndex || buildIndexFromEngine([], []);
}

async function fetchCommercialJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    message?: string;
  };
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Failed to load ${url}`);
  }
  return json.data as T;
}

/**
 * Ensure the search index includes products + industries + categories.
 * - Server: License Engine via existing SSOT loader
 * - Browser: existing website BFF routes (no direct Engine/API key usage)
 * Does not block callers that only need the products seed.
 */
export async function ensureSiteSearchIndexComplete(): Promise<SiteSearchResult[]> {
  if (isEngineBackedSearchIndex(cachedIndex)) {
    return cachedIndex as SiteSearchResult[];
  }
  if (completePromise) return completePromise;

  completePromise = (async () => {
    if (typeof window === "undefined") {
      const full = await buildSiteSearchIndexFromEngine();
      hydrateSiteSearchIndex(full);
      return full;
    }

    const [industriesRaw, categoriesRaw] = await Promise.all([
      fetchCommercialJson<CatalogIndustry[]>("/api/commercial/industries"),
      fetchCommercialJson<CatalogBusinessCategory[]>("/api/commercial/business-categories"),
    ]);
    const bundle = buildPublicCatalogFromRows(
      Array.isArray(industriesRaw) ? industriesRaw : [],
      Array.isArray(categoriesRaw) ? categoriesRaw : []
    );
    const full = buildIndexFromEngine(bundle.industries, bundle.categories);
    hydrateSiteSearchIndex(full);
    return full;
  })().catch((err) => {
    completePromise = null;
    throw err;
  });

  return completePromise;
}

export function searchSiteCatalog(query: string, limit = 12): SiteSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const tokens = q.split(/\s+/).filter(Boolean);
  const index = getSiteSearchIndex();

  return index
    .map((item) => {
      const hay = `${item.title} ${item.description} ${item.meta ?? ""} ${item.type}`.toLowerCase();
      if (!tokens.every((t) => hay.includes(t))) return null;

      let score = 0;
      const titleLower = item.title.toLowerCase();
      if (titleLower === q) score += 100;
      else if (titleLower.startsWith(q)) score += 60;
      else if (titleLower.includes(q)) score += 40;
      if (item.type === "Industry") score += 8;
      if (item.type === "Product") score += 5;
      return { item, score };
    })
    .filter((row): row is { item: SiteSearchResult; score: number } => Boolean(row))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);
}

export function getSearchCatalogStats() {
  const index = getSiteSearchIndex();
  return {
    industries: index.filter((i) => i.type === "Industry").length,
    categories: index.filter((i) => i.type === "Category").length,
    products: index.filter((i) => i.type === "Product").length,
    ready: isEngineBackedSearchIndex(index),
  };
}
