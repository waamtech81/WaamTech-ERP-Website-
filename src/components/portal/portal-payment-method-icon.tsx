"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { paymentMethodIcon } from "@/lib/portal/payment-method-icons";

export function PortalPaymentMethodIcon({
  methodId,
  label,
  className,
  size = "md",
}: {
  methodId: string;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const src = paymentMethodIcon(methodId);
  const dims =
    size === "sm"
      ? { box: "h-8 w-8", w: 64, h: 64 }
      : size === "lg"
        ? { box: "h-12 w-12", w: 96, h: 96 }
        : { box: "h-10 w-10", w: 80, h: 80 };

  if (!src) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-[var(--portal-soft)] px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]",
          dims.box,
          className
        )}
      >
        {label.slice(0, 3)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--portal-border)]/80 bg-white shadow-sm",
        dims.box,
        className
      )}
    >
      <Image
        src={src}
        alt={`${label} payment method`}
        width={dims.w}
        height={dims.h}
        quality={70}
        className="h-full w-full object-contain p-1"
      />
    </span>
  );
}
