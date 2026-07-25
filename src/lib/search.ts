import { products } from "@/lib/data/site";
import {
  getIndustryLucideIcon,
  getIndustryPresentation,
} from "@/lib/data/business-hierarchy";
import {
  loadEngineCatalogBundle,
  type PublicCategory,
  type PublicIndustry,
} from "@/lib/commercial/engine-industry-ssot";

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

/** Hydrate sync cache from a server-primed Engine index (no extra API call). */
export function hydrateSiteSearchIndex(index: SiteSearchResult[]): void {
  if (!Array.isArray(index) || !index.length) return;
  cachedIndex = index;
  cachePromise = Promise.resolve(index);
}

export async function buildSiteSearchIndexFromEngine(): Promise<SiteSearchResult[]> {
  if (cachedIndex) return cachedIndex;
  if (!cachePromise) {
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
    ready: Boolean(cachedIndex && cachedIndex.some((i) => i.type === "Industry")),
  };
}
