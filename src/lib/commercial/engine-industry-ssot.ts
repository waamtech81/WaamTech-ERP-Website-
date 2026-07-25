/**
 * Website Industry/Category reads — License Engine public catalog only.
 * Presentation chrome (icons/images) may still use business-hierarchy helpers.
 * This module never invents a second industry registry.
 */
import {
  fetchPublicBusinessCategories,
  fetchPublicIndustries,
} from "@/lib/commercial/client";
import type {
  CatalogBusinessCategory,
  CatalogIndustry,
} from "@/lib/commercial/types";
import type { MobileMode, PosMode } from "@/lib/data/business-hierarchy";

export type PublicIndustry = {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
};

export type PublicCategory = {
  id: string;
  code: string;
  slug: string;
  name: string;
  industry_id: string;
  pos_mode: PosMode;
  mobile_mode: MobileMode;
};

type CatalogBundle = {
  industries: PublicIndustry[];
  categories: PublicCategory[];
};

let bundleCache: CatalogBundle | null = null;
let bundlePromise: Promise<CatalogBundle> | null = null;

function asPosMode(value: unknown): PosMode {
  const v = String(value || "").trim().toLowerCase();
  if (v === "required" || v === "optional" || v === "disabled") return v;
  return "disabled";
}

function asMobileMode(value: unknown): MobileMode {
  const v = String(value || "").trim().toLowerCase();
  if (v === "required") return "required";
  return "disabled";
}

function industryKey(ind: CatalogIndustry): string {
  return String(ind.slug || ind.code || ind.id || "")
    .trim()
    .replace(/-/g, "_")
    .toLowerCase();
}

function categoryKey(cat: CatalogBusinessCategory): string {
  return String(cat.slug || cat.code || cat.id || "")
    .trim()
    .replace(/-/g, "_")
    .toLowerCase();
}

function mapIndustry(ind: CatalogIndustry): PublicIndustry {
  const code = String(ind.code || ind.slug || ind.id || "").trim();
  const slug = String(ind.slug || ind.code || ind.id || "")
    .trim()
    .replace(/_/g, "-")
    .toLowerCase();
  return {
    id: industryKey(ind),
    code,
    slug,
    name: String(ind.name || code),
    description: String(ind.description || ""),
    icon: ind.icon || null,
  };
}

function mapCategory(cat: CatalogBusinessCategory): PublicCategory {
  const code = String(cat.code || cat.slug || cat.id || "").trim();
  const slug = String(cat.slug || cat.code || cat.id || "")
    .trim()
    .replace(/_/g, "-")
    .toLowerCase();
  return {
    id: categoryKey(cat),
    code,
    slug,
    name: String(cat.name || code),
    // Preserve UUID punctuation until the industry relation is resolved.
    industry_id: String(cat.industry_id || "").trim().toLowerCase(),
    pos_mode: asPosMode(cat.pos_requirement ?? cat.pos_mode),
    mobile_mode: asMobileMode(cat.mobile_requirement ?? cat.mobile_mode),
  };
}

/** Single shared Engine catalog fetch (industries + categories). */
export async function loadEngineCatalogBundle(): Promise<CatalogBundle> {
  if (bundleCache) return bundleCache;
  if (!bundlePromise) {
    bundlePromise = (async () => {
      const [industriesResult, categoriesResult] = await Promise.all([
        fetchPublicIndustries(),
        fetchPublicBusinessCategories(),
      ]);
      const industries =
        industriesResult.ok && industriesResult.data?.length
          ? industriesResult.data.map(mapIndustry)
          : [];
      const categories =
        categoriesResult.ok && categoriesResult.data?.length
          ? categoriesResult.data.map(mapCategory)
          : [];

      // Resolve category.industry_id UUID → industry code key when needed.
      const byUuid = new Map<string, string>();
      for (const raw of industriesResult.data || []) {
        const key = industryKey(raw);
        if (raw.id) byUuid.set(String(raw.id).trim().toLowerCase(), key);
      }
      for (const cat of categories) {
        if (byUuid.has(cat.industry_id)) {
          cat.industry_id = byUuid.get(cat.industry_id) || cat.industry_id;
        } else {
          cat.industry_id = cat.industry_id.replace(/-/g, "_");
        }
      }

      bundleCache = { industries, categories };
      return bundleCache;
    })();
  }
  return bundlePromise;
}

/** Fetch public industries from License Engine (SSOT). */
export async function getEnginePublicIndustries(): Promise<PublicIndustry[]> {
  const bundle = await loadEngineCatalogBundle();
  return bundle.industries;
}

/** Fetch public categories from License Engine (SSOT), optionally scoped. */
export async function getEnginePublicCategories(
  industryId?: string
): Promise<PublicCategory[]> {
  const bundle = await loadEngineCatalogBundle();
  if (!industryId) return bundle.categories;
  const key = String(industryId)
    .trim()
    .replace(/-/g, "_")
    .toLowerCase();
  const industry = bundle.industries.find(
    (i) =>
      i.id === key ||
      i.code.toLowerCase() === key ||
      i.slug.replace(/-/g, "_") === key
  );
  if (!industry) {
    return bundle.categories.filter(
      (c) =>
        c.industry_id === key ||
        c.industry_id === String(industryId).trim().toLowerCase()
    );
  }
  return bundle.categories.filter(
    (c) =>
      c.industry_id === industry.id ||
      c.industry_id === industry.code.toLowerCase()
  );
}

export async function resolveEngineIndustrySlug(
  slug: string
): Promise<{ industry: PublicIndustry; categories: PublicCategory[] } | null> {
  const key = String(slug || "")
    .trim()
    .replace(/-/g, "_")
    .toLowerCase();
  if (!key) return null;
  const industries = await getEnginePublicIndustries();
  const industry =
    industries.find((i) => i.id === key || i.slug.replace(/-/g, "_") === key) ||
    null;
  if (!industry) return null;
  const categories = await getEnginePublicCategories(industry.code || industry.id);
  return { industry, categories };
}
