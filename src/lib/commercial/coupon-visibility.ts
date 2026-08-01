/**
 * Coupon field visibility SSOT (UI only — does not change pricing/discount engines).
 *
 * Custom ERP first purchase: coupon is entered on the Website builder; later
 * License Engine / signup checkout must not ask again.
 * Custom ERP after license ownership: coupon field visible (portal upgrades, etc.).
 * Predefined plans: coupon field always visible where checkout supports coupons.
 */

export type CouponVisibilityJourney = "custom_erp" | "predefined";

export type CouponVisibilityPhase = "first_purchase" | "post_license";

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
