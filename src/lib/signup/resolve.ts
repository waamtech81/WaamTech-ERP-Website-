import {
  fetchPublicBusinessCategories,
  fetchPublicBusinessProfiles,
  fetchPublicIndustries,
} from "@/lib/commercial/client";
import type {
  CatalogBusinessCategory,
  CatalogBusinessProfile,
  CatalogIndustry,
} from "@/lib/commercial/types";
import {
  catalogSlugMatches,
  isUuid,
  normalizePermalinkSlug,
} from "@/lib/signup/permalinks";

export type ResolvedSignupHierarchy = {
  industry: CatalogIndustry;
  category: CatalogBusinessCategory | null;
  profile: CatalogBusinessProfile | null;
};

function findIndustry(
  industries: CatalogIndustry[],
  needle: string
): CatalogIndustry | undefined {
  return industries.find((i) => catalogSlugMatches(i, needle));
}

function findCategory(
  categories: CatalogBusinessCategory[],
  needle: string
): CatalogBusinessCategory | undefined {
  return categories.find((c) => catalogSlugMatches(c, needle));
}

function findProfile(
  profiles: CatalogBusinessProfile[],
  needle: string
): CatalogBusinessProfile | undefined {
  return profiles.find((p) => catalogSlugMatches(p, needle));
}

/** Resolve public permalink slugs → Engine records (UUIDs stay server/internal only). */
export async function resolveSignupBySlugs(opts: {
  industrySlug: string;
  categorySlug?: string | null;
  profileSlug?: string | null;
}): Promise<ResolvedSignupHierarchy | null> {
  const industrySlug = normalizePermalinkSlug(opts.industrySlug);
  if (!industrySlug || isUuid(industrySlug)) return null;

  const industries = await fetchPublicIndustries();
  if (!industries.ok || !industries.data.length) return null;

  const industry = findIndustry(industries.data, industrySlug);
  if (!industry) return null;

  let category: CatalogBusinessCategory | null = null;
  const categorySlug = normalizePermalinkSlug(opts.categorySlug);
  if (categorySlug) {
    if (isUuid(categorySlug)) return null;
    const categories = await fetchPublicBusinessCategories(industry.id);
    if (!categories.ok) return null;
    category = findCategory(categories.data, categorySlug) || null;
    if (!category) return null;
  }

  let profile: CatalogBusinessProfile | null = null;
  const profileSlug = normalizePermalinkSlug(opts.profileSlug);
  if (profileSlug && category) {
    if (isUuid(profileSlug)) {
      // Caller should rewrite UUID → slug; still resolve for redirect
      const profiles = await fetchPublicBusinessProfiles(category.id);
      profile = profiles.data.find((p) => p.id === opts.profileSlug?.trim()) || null;
    } else {
      const profiles = await fetchPublicBusinessProfiles(category.id);
      profile = findProfile(profiles.data, profileSlug) || null;
    }
  }

  return { industry, category, profile };
}

/** Resolve legacy UUID query params → catalog rows (for 301 redirect to slug URLs). */
export async function resolveSignupByIds(opts: {
  industryId?: string | null;
  categoryId?: string | null;
  profileId?: string | null;
}): Promise<ResolvedSignupHierarchy | null> {
  const industryId = opts.industryId?.trim() || "";
  const categoryId = opts.categoryId?.trim() || "";
  const profileId = opts.profileId?.trim() || "";

  if (!industryId && !categoryId) return null;

  const industries = await fetchPublicIndustries();
  if (!industries.ok || !industries.data.length) return null;

  let industry: CatalogIndustry | undefined;
  if (industryId) {
    industry = industries.data.find((i) => i.id === industryId);
  }

  let category: CatalogBusinessCategory | null = null;
  if (categoryId) {
    const categories = await fetchPublicBusinessCategories(
      industry?.id || undefined
    );
    category = categories.data.find((c) => c.id === categoryId) || null;
    if (category && !industry && category.industry_id) {
      industry = industries.data.find((i) => i.id === category!.industry_id);
    }
  }

  if (!industry) return null;

  if (categoryId && !category) return null;

  let profile: CatalogBusinessProfile | null = null;
  if (profileId && category) {
    const profiles = await fetchPublicBusinessProfiles(category.id);
    profile = profiles.data.find((p) => p.id === profileId) || null;
  }

  return { industry, category, profile };
}

/** Public slug for a catalog row (prefer Engine slug). */
export function publicCatalogSlug(item: {
  slug?: string | null;
  code?: string | null;
  id?: string;
}): string {
  if (item.slug) return normalizePermalinkSlug(item.slug);
  if (item.code) return normalizePermalinkSlug(item.code);
  if (item.id && !isUuid(item.id)) return normalizePermalinkSlug(item.id);
  return "";
}
