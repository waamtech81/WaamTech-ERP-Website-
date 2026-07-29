import type { CatalogPlan } from "@/lib/commercial/types";
import type { SignupPackageType } from "@/lib/signup/custom-package";

export type SignupCommercialMode = "trial" | "paid";

type PlanLike = Pick<
  CatalogPlan,
  "slug" | "tier" | "lifetime_price" | "has_free_trial" | "name"
> | null;

/**
 * Trial stays for Starter / Business.
 * Lifetime, Enterprise, and Custom ERP go through paid signup → public checkout.
 */
export function resolveSignupCommercialMode(input: {
  packageType: SignupPackageType;
  plan?: PlanLike;
  billingCycle?: string | null;
}): SignupCommercialMode {
  if (input.packageType === "custom") return "paid";

  const cycle = String(input.billingCycle || "").toLowerCase();
  if (cycle === "lifetime") return "paid";

  const slug = String(input.plan?.slug || input.plan?.tier || input.plan?.name || "").toLowerCase();
  const tier = String(input.plan?.tier || "").toLowerCase();

  if (
    input.plan?.lifetime_price != null ||
    slug === "lifetime" ||
    tier === "lifetime" ||
    slug.includes("lifetime")
  ) {
    return "paid";
  }

  if (slug === "enterprise" || tier === "enterprise") return "paid";

  if (
    slug === "starter" ||
    slug === "business" ||
    tier === "starter" ||
    tier === "business" ||
    slug.includes("starter") ||
    slug.includes("business")
  ) {
    return "trial";
  }

  if (input.plan?.has_free_trial === false) return "paid";
  return "trial";
}

export function signupModeCtaLabel(mode: SignupCommercialMode, _plan?: PlanLike): string {
  if (mode === "paid") return "Create Account";
  return "Start Free Trial";
}

export function planAllowsFreeTrial(plan?: PlanLike): boolean {
  const slug = String(plan?.slug || plan?.tier || "").toLowerCase();
  const tier = String(plan?.tier || "").toLowerCase();
  if (slug === "enterprise" || tier === "enterprise") return false;
  if (
    slug === "lifetime" ||
    tier === "lifetime" ||
    slug.includes("lifetime") ||
    plan?.lifetime_price != null
  ) {
    return false;
  }
  return true;
}
