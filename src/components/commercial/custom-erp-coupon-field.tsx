"use client";

import { memo } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  couponCode: string;
  onCouponCodeChange: (value: string) => void;
  onApplyCoupon: () => void;
  onClearCoupon?: () => void;
  couponError?: string | null;
  couponBusy?: boolean;
  couponApplied?: boolean;
  appliedCode?: string | null;
  discountAmount?: number;
  formatPrice: (n: number) => string;
  showDiscount?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Isolated coupon input — memoized so builder pricing updates do not rerender it. */
export const CustomErpCouponField = memo(function CustomErpCouponField({
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  onClearCoupon,
  couponError,
  couponBusy,
  couponApplied,
  appliedCode,
  discountAmount = 0,
  formatPrice,
  showDiscount,
  disabled,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 p-3",
        couponError
          ? "border-rose-300 bg-rose-50/80"
          : couponApplied
            ? "border-emerald-300 bg-emerald-50/70"
            : "border-amber-300 bg-amber-50/60",
        className
      )}
    >
      <label
        htmlFor="custom-erp-coupon"
        className="flex items-center gap-1.5 text-sm font-semibold text-[#0b1f3a]"
      >
        <Tag className="h-4 w-4 text-amber-700" />
        Coupon / discount code
      </label>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Enter a promo code — Apply updates your payable total.
      </p>
      <div className="mt-2.5 flex gap-2">
        <input
          id="custom-erp-coupon"
          type="text"
          value={couponCode}
          onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onApplyCoupon();
            }
          }}
          placeholder="e.g. SAVE20"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-full border bg-white px-4 text-sm font-semibold uppercase tracking-wide text-[#0b1f3a] outline-none focus-visible:ring-2",
            couponError
              ? "border-rose-400 focus-visible:ring-rose-300/40"
              : couponApplied
                ? "border-emerald-400 focus-visible:ring-emerald-300/40"
                : "border-amber-300 focus-visible:border-primary/40 focus-visible:ring-primary/20"
          )}
        />
        <Button
          type="button"
          className="h-11 shrink-0 rounded-full px-5"
          disabled={couponBusy || disabled}
          onClick={onApplyCoupon}
        >
          {couponBusy ? "…" : "Apply"}
        </Button>
      </div>
      {couponError ? (
        <p className="mt-2 text-xs font-medium text-rose-700" role="alert">
          {couponError}
        </p>
      ) : couponApplied ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-emerald-800">
            Applied: {appliedCode}
            {showDiscount && discountAmount > 0
              ? ` (−${formatPrice(discountAmount)})`
              : ""}
          </p>
          {onClearCoupon ? (
            <button
              type="button"
              onClick={onClearCoupon}
              className="text-xs font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Optional — leave blank if you don&apos;t have a code.
        </p>
      )}
    </div>
  );
});
