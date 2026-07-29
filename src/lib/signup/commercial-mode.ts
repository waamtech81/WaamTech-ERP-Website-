import type { CatalogPlan } from "@/lib/commercial/types";
import type { SignupPackageType } from "@/lib/signup/custom-package";

export type SignupCommercialMode = "trial" | "paid";

type PlanLike = Pick<
  CatalogPlan,
  "slug" | "tier" | "lifetime_price" | "has_free_trial" | "name"
> | null;

/** Starter + Business = free trial; Custom ERP + Lifetime = paid only. */
export function resolveSignupCommercialMode(input: {
  packageType: SignupPackageType;
  plan?: PlanLike;
  billingCycle?: string | null;
}): SignupCommercialMode {
  if (input.packageType === "custom") return "paid";

  const slug = String(input.plan?.slug || input.plan?.tier || "").toLowerCase();
  const tier = String(input.plan?.tier || "").toLowerCase();
  const billing = String(input.billingCycle || "").toLowerCase();

  if (
    input.plan?.lifetime_price != null ||
    slug === "lifetime" ||
    tier === "lifetime" ||
    billing === "lifetime"
  ) {
    return "paid";
  }

  if (
    slug === "starter" ||
    slug === "business" ||
    tier === "starter" ||
    tier === "business"
  ) {
    return "trial";
  }

  if (input.plan?.has_free_trial) return "trial";
  return "paid";
}

export function signupModeCtaLabel(mode: SignupCommercialMode, plan?: PlanLike): string {
  if (mode === "paid") return "Ready to Buy";
  const slug = String(plan?.slug || plan?.tier || "").toLowerCase();
  if (slug.includes("business")) return "Start Free Trial";
  if (slug.includes("starter")) return "Start Free Trial";
  return "Start Free Trial";
}

export function planAllowsFreeTrial(plan?: PlanLike): boolean {
  return resolveSignupCommercialMode({
    packageType: "predefined",
    plan,
    billingCycle: plan?.lifetime_price != null ? "lifetime" : null,
  }) === "trial";
}
