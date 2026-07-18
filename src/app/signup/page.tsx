import { redirect } from "next/navigation";
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
import { SignUpClient } from "./signup-client";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams: Promise<SearchParams>;
};

function first(sp: SearchParams, key: string): string {
  const raw = sp[key];
  return (Array.isArray(raw) ? raw[0] : raw)?.trim() || "";
}

function commercialOpts(preserved: Record<string, string>) {
  return {
    product: preserved.product,
    planId: preserved.plan_id,
    planSlug: preserved.plan,
    billingCycle: preserved.billing_cycle,
  };
}

/**
 * /signup — bare form, or legacy query rewrite:
 *   ?industry=<uuid>&category=<uuid>  →  /signup/{industry-slug}/{category-slug}
 *   ?industry=retail-commerce&category=retail-store  →  path permalink
 */
export default async function SignUpPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const industry = first(sp, "industry");
  const category = first(sp, "category");
  const profile = first(sp, "profile");
  const preserved = pickSignupPreserveQuery(sp);
  const commercial = commercialOpts(preserved);

  if (industry || category) {
    const hasUuid =
      isUuid(industry) || isUuid(category) || (profile ? isUuid(profile) : false);

    if (hasUuid) {
      const resolved = await resolveSignupByIds({
        industryId: isUuid(industry) ? industry : undefined,
        categoryId: isUuid(category) ? category : undefined,
        profileId: isUuid(profile) ? profile : undefined,
      });

      // If industry was a non-UUID slug mixed with UUID category, resolve industry by slug first
      let industryRecord = resolved?.industry;
      if (!industryRecord && industry && !isUuid(industry)) {
        const bySlug = await resolveSignupBySlugs({ industrySlug: industry });
        industryRecord = bySlug?.industry;
      }

      if (!industryRecord) {
        redirect(buildSignupPermalink(commercial));
      }

      let categorySlug: string | undefined;
      if (resolved?.category) {
        categorySlug = publicCatalogSlug(resolved.category);
      } else if (category && !isUuid(category)) {
        const withCat = await resolveSignupBySlugs({
          industrySlug: publicCatalogSlug(industryRecord),
          categorySlug: category,
        });
        categorySlug = withCat?.category
          ? publicCatalogSlug(withCat.category)
          : undefined;
      }

      redirect(
        buildSignupPermalink({
          industrySlug: publicCatalogSlug(industryRecord),
          categorySlug,
          profileSlug: resolved?.profile
            ? publicCatalogSlug(resolved.profile)
            : profile && !isUuid(profile)
              ? normalizePermalinkSlug(profile)
              : undefined,
          ...commercial,
        })
      );
    }

    // Slug-style query → preferred path permalink
    const industrySlug = normalizePermalinkSlug(industry);
    if (industrySlug) {
      const industryOnly = await resolveSignupBySlugs({ industrySlug });
      if (!industryOnly?.industry) {
        redirect(buildSignupPermalink(commercial));
      }

      const categorySlug = category ? normalizePermalinkSlug(category) : "";
      if (categorySlug) {
        const withCat = await resolveSignupBySlugs({
          industrySlug,
          categorySlug,
          profileSlug: profile && !isUuid(profile) ? profile : undefined,
        });
        if (withCat?.category) {
          redirect(
            buildSignupPermalink({
              industrySlug: publicCatalogSlug(withCat.industry),
              categorySlug: publicCatalogSlug(withCat.category),
              profileSlug: withCat.profile
                ? publicCatalogSlug(withCat.profile)
                : profile && !isUuid(profile)
                  ? normalizePermalinkSlug(profile)
                  : undefined,
              ...commercial,
            })
          );
        }
        // Invalid category slug → industry-only path
        redirect(
          buildSignupPermalink({
            industrySlug: publicCatalogSlug(industryOnly.industry),
            ...commercial,
          })
        );
      }

      redirect(
        buildSignupPermalink({
          industrySlug: publicCatalogSlug(industryOnly.industry),
          profileSlug:
            profile && !isUuid(profile) ? normalizePermalinkSlug(profile) : undefined,
          ...commercial,
        })
      );
    }
  }

  if (profile && isUuid(profile) && !industry && !category) {
    redirect(buildSignupPermalink(commercial));
  }

  return <SignUpClient />;
}
