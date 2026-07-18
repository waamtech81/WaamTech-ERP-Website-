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

/** /signup/retail-commerce/retail-store */
export default async function SignUpIndustryCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { industrySlug: rawIndustry, categorySlug: rawCategory } = await params;
  const sp = await searchParams;
  const industrySlug = normalizePermalinkSlug(rawIndustry);
  const categorySlug = normalizePermalinkSlug(rawCategory);
  const preserved = pickSignupPreserveQuery(sp);
  const profileRaw = (Array.isArray(sp.profile) ? sp.profile[0] : sp.profile)?.trim() || "";

  if (!industrySlug || !categorySlug || isUuid(rawIndustry) || isUuid(rawCategory)) {
    notFound();
  }

  const resolved = await resolveSignupBySlugs({
    industrySlug,
    categorySlug,
    profileSlug: profileRaw && !isUuid(profileRaw) ? profileRaw : undefined,
  });
  if (!resolved?.industry || !resolved.category) notFound();

  // Rewrite profile UUID → slug in the public URL
  if (profileRaw && isUuid(profileRaw)) {
    const withProfile = await resolveSignupByIds({
      industryId: resolved.industry.id,
      categoryId: resolved.category.id,
      profileId: profileRaw,
    });
    redirect(
      buildSignupPermalink({
        industrySlug: publicCatalogSlug(resolved.industry),
        categorySlug: publicCatalogSlug(resolved.category),
        profileSlug: withProfile?.profile
          ? publicCatalogSlug(withProfile.profile)
          : undefined,
        product: preserved.product,
        planId: preserved.plan_id,
        planSlug: preserved.plan,
        billingCycle: preserved.billing_cycle,
      })
    );
  }

  return (
    <SignUpClient
      industrySlug={publicCatalogSlug(resolved.industry)}
      categorySlug={publicCatalogSlug(resolved.category)}
      resolvedIndustryId={resolved.industry.id}
      resolvedCategoryId={resolved.category.id}
    />
  );
}
