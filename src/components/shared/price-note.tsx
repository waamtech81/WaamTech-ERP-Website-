"use client";

import { useLocale } from "@/components/providers/locale-provider";

/** Small clarifying note: prices are converted for display, billed in USD. */
export function PriceNote({ className }: { className?: string }) {
  const { currency, currencies, t } = useLocale();
  if (currency === "USD") return null;
  return (
    <p
      className={`notranslate ${className ?? "text-center text-xs text-muted-foreground"}`.trim()}
      translate="no"
    >
      {t("pricing.priceNote", "Prices shown in {{currency}} — billed in USD.", {
        currency: `${currencies[currency].name} (${currency})`,
      })}
    </p>
  );
}
