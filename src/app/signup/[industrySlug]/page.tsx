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
import { SignUpClient } from "../signup-client";

type PageProps = {
  params: Promise<{ industrySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string {
  const raw = sp[key];
  return (Array.isArray(raw) ? raw[0] : raw)?.trim() || "";
}

/** /signup/:industrySlug */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industrySlug: raw } = await params;
  const industrySlug = normalizePermalinkSlug(raw);
  if (!industrySlug || isUuid(raw)) return { title: "Sign up" };
  const resolved = await resolveSignupBySlugs({ industrySlug });
  if (!resolved?.industry) return { title: "Sign up" };
  return {
    title: `Sign up — ${resolved.industry.name}`,
    description: `Create your WAAMTO account for ${resolved.industry.name}.`,
    robots: { index: true, follow: true },
  };
}

export default async function SignUpIndustryPage({ params, searchParams }: PageProps) {
  const { industrySlug: raw } = await params;
  const sp = await searchParams;
  const industrySlug = normalizePermalinkSlug(raw);
  const preserved = pickSignupPreserveQuery(sp);
  const categoryQ = first(sp, "category");
  const profileRaw = first(sp, "profile");

  if (!industrySlug || isUuid(raw)) notFound();

  const resolved = await resolveSignupBySlugs({ industrySlug });
  if (!resolved?.industry) notFound();

  const canonicalIndustry = publicCatalogSlug(resolved.industry);

  // ?category= on industry path → nest under /signup/{industry}/{category}
  if (categoryQ) {
    if (isUuid(categoryQ)) {
      const fromUuid = await resolveSignupByIds({
        industryId: resolved.industry.id,
        categoryId: categoryQ,
        profileId: isUuid(profileRaw) ? profileRaw : undefined,
      });
      if (!fromUuid?.category) notFound();
      redirect(
        buildSignupPermalink({
          industrySlug: publicCatalogSlug(fromUuid.industry),
          categorySlug: publicCatalogSlug(fromUuid.category),
          profileSlug: fromUuid.profile
            ? publicCatalogSlug(fromUuid.profile)
            : profileRaw && !isUuid(profileRaw)
              ? normalizePermalinkSlug(profileRaw)
              : undefined,
          product: preserved.product,
          planId: preserved.plan_id,
          planSlug: preserved.plan,
          billingCycle: preserved.billing_cycle,
        })
      );
    }

    const nested = await resolveSignupBySlugs({
      industrySlug: canonicalIndustry,
      categorySlug: categoryQ,
      profileSlug: profileRaw && !isUuid(profileRaw) ? profileRaw : undefined,
    });
    if (!nested?.category) notFound();
    redirect(
      buildSignupPermalink({
        industrySlug: publicCatalogSlug(nested.industry),
        categorySlug: publicCatalogSlug(nested.category),
        profileSlug: nested.profile
          ? publicCatalogSlug(nested.profile)
          : profileRaw && !isUuid(profileRaw)
            ? normalizePermalinkSlug(profileRaw)
            : undefined,
        product: preserved.product,
        planId: preserved.plan_id,
        planSlug: preserved.plan,
        billingCycle: preserved.billing_cycle,
      })
    );
  }

  // Canonical industry slug in the path
  if (industrySlug !== canonicalIndustry) {
    redirect(
      buildSignupPermalink({
        industrySlug: canonicalIndustry,
        profileSlug:
          profileRaw && !isUuid(profileRaw)
            ? normalizePermalinkSlug(profileRaw)
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
      industrySlug={canonicalIndustry}
      resolvedIndustryId={resolved.industry.id}
      hierarchyValidated
    />
  );
}
