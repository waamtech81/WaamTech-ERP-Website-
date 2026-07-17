import { products } from "@/lib/data/site";
import {
  businessCategories,
  businessIndustries,
  getBusinessIndustry,
  getIndustryLucideIcon,
} from "@/lib/data/business-hierarchy";

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

function buildSearchIndex(): SiteSearchResult[] {
  const productItems: SiteSearchResult[] = products.map((p) => ({
    id: `product:${p.id}`,
    title: p.name,
    description: p.tagline,
    href: `/products#${p.slug}`,
    type: "Product",
    icon: p.icon,
    meta: p.category,
  }));

  const industryItems: SiteSearchResult[] = businessIndustries.map((ind) => ({
    id: `industry:${ind.id}`,
    title: ind.name,
    description: ind.description,
    href: `/industries/${ind.id}`,
    type: "Industry",
    icon: getIndustryLucideIcon(ind),
    color: ind.color,
  }));

  const categoryItems: SiteSearchResult[] = businessCategories.map((cat) => {
    const industry = getBusinessIndustry(cat.industry_id);
    return {
      id: `category:${cat.id}`,
      title: cat.name,
      description: industry
        ? `${industry.name} · POS ${cat.pos_mode}`
        : `POS ${cat.pos_mode}`,
      href: `/signup?industry=${cat.industry_id}&profile=${cat.id}`,
      type: "Category",
      icon: industry ? getIndustryLucideIcon(industry) : "Boxes",
      color: industry?.color,
      meta: industry?.name,
    };
  });

  return [...productItems, ...industryItems, ...categoryItems];
}

let cachedIndex: SiteSearchResult[] | null = null;

export function getSiteSearchIndex(): SiteSearchResult[] {
  if (!cachedIndex) cachedIndex = buildSearchIndex();
  return cachedIndex;
}

export function searchSiteCatalog(query: string, limit = 12): SiteSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = getSiteSearchIndex()
    .map((item) => {
      const hay = `${item.title} ${item.description} ${item.meta ?? ""} ${item.type}`.toLowerCase();
      if (!tokens.every((t) => hay.includes(t))) return null;

      let score = 0;
      const titleLower = item.title.toLowerCase();
      if (titleLower === q) score += 100;
      else if (titleLower.startsWith(q)) score += 60;
      else if (titleLower.includes(q)) score += 40;
      else score += 10;

      if (item.type === "Product") score += 3;
      if (item.type === "Industry") score += 2;
      return { item, score };
    })
    .filter((x): x is { item: SiteSearchResult; score: number } => Boolean(x))
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

  return scored.slice(0, limit).map((s) => s.item);
}
