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

/** /signup/retail-commerce */
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

  // ?category= on industry path → nest under /signup/{industry}/{category}
  if (categoryQ) {
    if (isUuid(categoryQ)) {
      const fromUuid = await resolveSignupByIds({
        industryId: resolved.industry.id,
        categoryId: categoryQ,
        profileId: isUuid(profileRaw) ? profileRaw : undefined,
      });
      if (fromUuid?.category) {
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
    } else {
      const nested = await resolveSignupBySlugs({
        industrySlug: publicCatalogSlug(resolved.industry),
        categorySlug: categoryQ,
        profileSlug: profileRaw && !isUuid(profileRaw) ? profileRaw : undefined,
      });
      if (nested?.category) {
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
    }
  }

  return (
    <SignUpClient
      industrySlug={publicCatalogSlug(resolved.industry)}
      resolvedIndustryId={resolved.industry.id}
    />
  );
}
