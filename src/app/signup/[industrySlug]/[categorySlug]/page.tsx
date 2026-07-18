import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  buildSignupPermalink,
  isUuid,
  normalizePermalinkSlug,
  pickSignupPreserveQuery,
} from "@/lib/signup/permalinks";
import {
  publicCatalogSlug,
  resolveSignupByIds,
  resolveSignupBySlugs,
} from "@/lib/signup/resolve";
import { SignUpClient } from "../../signup-client";

type PageProps = {
  params: Promise<{ industrySlug: string; categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * /signup/:industrySlug/:categorySlug
 * SEO path only — commercial data always resolved from License Engine, never trusted from URL text.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industrySlug: rawIndustry, categorySlug: rawCategory } = await params;
  const industrySlug = normalizePermalinkSlug(rawIndustry);
  const categorySlug = normalizePermalinkSlug(rawCategory);
  if (!industrySlug || !categorySlug || isUuid(rawIndustry) || isUuid(rawCategory)) {
    return { title: "Sign up" };
  }
  const resolved = await resolveSignupBySlugs({ industrySlug, categorySlug });
  if (!resolved?.industry || !resolved.category) {
    return { title: "Sign up" };
  }
  return {
    title: `Sign up — ${resolved.category.name} | ${resolved.industry.name}`,
    description: `Create your WAAMTO account for ${resolved.category.name} in ${resolved.industry.name}.`,
    robots: { index: true, follow: true },
  };
}

export default async function SignUpIndustryCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { industrySlug: rawIndustry, categorySlug: rawCategory } = await params;
  const sp = await searchParams;
  const industrySlug = normalizePermalinkSlug(rawIndustry);
  const categorySlug = normalizePermalinkSlug(rawCategory);
  const preserved = pickSignupPreserveQuery(sp);
  const profileRaw =
    (Array.isArray(sp.profile) ? sp.profile[0] : sp.profile)?.trim() || "";

  // Reject UUID path segments and empty slugs — never treat URL text as commercial SSOT
  if (!industrySlug || !categorySlug || isUuid(rawIndustry) || isUuid(rawCategory)) {
    notFound();
  }

  const resolved = await resolveSignupBySlugs({
    industrySlug,
    categorySlug,
    profileSlug: profileRaw && !isUuid(profileRaw) ? profileRaw : undefined,
  });
  if (!resolved?.industry || !resolved.category) notFound();

  const canonicalIndustry = publicCatalogSlug(resolved.industry);
  const canonicalCategory = publicCatalogSlug(resolved.category);

  // Canonicalize SEO slugs + rewrite profile UUID → slug
  if (
    industrySlug !== canonicalIndustry ||
    categorySlug !== canonicalCategory ||
    (profileRaw && isUuid(profileRaw))
  ) {
    let profileSlug: string | undefined =
      profileRaw && !isUuid(profileRaw) ? normalizePermalinkSlug(profileRaw) : undefined;

    if (profileRaw && isUuid(profileRaw)) {
      const withProfile = await resolveSignupByIds({
        industryId: resolved.industry.id,
        categoryId: resolved.category.id,
        profileId: profileRaw,
      });
      profileSlug = withProfile?.profile
        ? publicCatalogSlug(withProfile.profile)
        : undefined;
    } else if (resolved.profile) {
      profileSlug = publicCatalogSlug(resolved.profile);
    }

    redirect(
      buildSignupPermalink({
        industrySlug: canonicalIndustry,
        categorySlug: canonicalCategory,
        profileSlug,
        product: preserved.product,
        planId: preserved.plan_id,
        planSlug: preserved.plan,
        billingCycle: preserved.billing_cycle,
      })
    );
  }

  return (
    <SignUpClient
      industrySlug={canonicalIndustry}
      categorySlug={canonicalCategory}
      resolvedIndustryId={resolved.industry.id}
      resolvedCategoryId={resolved.category.id}
      hierarchyValidated
    />
  );
}
