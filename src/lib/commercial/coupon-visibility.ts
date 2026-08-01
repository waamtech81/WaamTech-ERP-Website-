/**
 * Coupon field visibility SSOT (UI only — does not change pricing/discount engines).
 *
 * Custom ERP first purchase: coupon is entered on the Website builder; later
 * License Engine / signup checkout must not ask again.
 * Custom ERP first post-purchase upgrade: hide coupon when initial purchase
 * already applied a coupon (do not reuse on first upgrade).
 * Custom ERP after prior paid upgrade: coupon field visible.
 * Predefined plans: coupon field always visible where checkout supports coupons.
 */

export type CouponVisibilityJourney = "custom_erp" | "predefined";

export type CouponVisibilityPhase =
  | "first_purchase"
  | "first_post_purchase_upgrade"
  | "post_license";

export type CouponVisibilityContext =
  | { journey: "custom_erp"; phase: CouponVisibilityPhase }
  | { journey: "predefined" };

/** Whether the Coupon Code input may be shown on a checkout / quote surface. */
export function shouldShowCheckoutCouponField(
  ctx: CouponVisibilityContext
): boolean {
  if (ctx.journey === "predefined") return true;
  return ctx.phase === "post_license";
}

export function resolveCustomErpUpgradeCouponPhase(input: {
  initialPurchaseCouponApplied?: boolean;
  completedCustomUpgrades?: number;
}): CouponVisibilityPhase {
  const completed = Math.max(0, Number(input.completedCustomUpgrades) || 0);
  if (input.initialPurchaseCouponApplied && completed === 0) {
    return "first_post_purchase_upgrade";
  }
  return "post_license";
}

export function snapshotInitialCouponApplied(
  pricing?: Record<string, unknown> | null
): boolean {
  if (!pricing || typeof pricing !== "object") return false;
  const code = String(pricing.discount_code || pricing.coupon || "").trim();
  const discountAmount = Number(pricing.discount_amount || 0);
  return Boolean(code) || (Number.isFinite(discountAmount) && discountAmount > 0);
}

/**
 * Infer Custom ERP first-purchase handoff from checkout session purpose/metadata.
 * Used to keep the Coupon Code field hidden after Website builder apply.
 */
export function isCustomErpFirstPurchaseCheckout(input: {
  purpose?: string | null;
  mode?: string | null;
  packageType?: string | null;
  metadata?: Record<string, unknown> | null;
}): boolean {
  const purpose = String(input.purpose || input.mode || "")
    .trim()
    .toLowerCase();
  const meta = input.metadata || {};
  const packageType = String(
    input.packageType ||
      meta.package_type ||
      meta.packageType ||
      meta.journey ||
      ""
  )
    .trim()
    .toLowerCase();
  const isCustom =
    packageType === "custom" ||
    packageType === "custom_erp" ||
    meta.custom_package === true ||
    meta.is_custom_erp === true ||
    Boolean(meta.custom_package_id || meta.customPackageId);
  const isFirstPurchase =
    purpose === "signup" ||
    purpose === "signup_paid" ||
    purpose === "new_subscription" ||
    purpose === "purchase" ||
    meta.first_purchase === true;
  return isCustom && isFirstPurchase;
}
