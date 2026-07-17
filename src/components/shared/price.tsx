"use client";

import { useLocale } from "@/components/providers/locale-provider";
import type { FormatMoneyOptions } from "@/lib/currency/format";

type PriceProps = {
  /** Amount in USD (master currency). Always stored/passed in USD. */
  usd: number;
  className?: string;
  showCode?: boolean;
  decimals?: number;
} & Omit<FormatMoneyOptions, "showCode" | "decimals">;

/**
 * Displays a USD-stored amount converted to the visitor's active currency.
 * SSR renders with the server-detected currency + rates, so there is no
 * flicker and no hydration mismatch; switching currency updates instantly.
 */
export function Price({ usd, className, showCode, decimals }: PriceProps) {
  const { formatPrice } = useLocale();
  // notranslate: keep amounts intact under Google Website Translator
  return (
    <span className={`notranslate ${className ?? ""}`.trim()} translate="no">
      {formatPrice(usd, { showCode, decimals })}
    </span>
  );
}
