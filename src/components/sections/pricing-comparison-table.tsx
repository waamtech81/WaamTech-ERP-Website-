"use client";

import { Check, Minus } from "lucide-react";
import type { PricingPlan } from "@/types";
import { CatalogSkeleton } from "@/components/commercial/catalog-states";

type PricingComparisonTableProps = {
  plans: PricingPlan[];
  rows: Array<Record<string, string | boolean>>;
  loading?: boolean;
};

export function PricingComparisonTable({
  plans,
  rows,
  loading,
}: PricingComparisonTableProps) {
  if (loading) {
    return <CatalogSkeleton rows={2} className="xl:grid-cols-1" />;
  }

  if (!plans.length || !rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white -mx-1 px-1 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-slate-50/80">
            <th className="sticky left-0 z-10 bg-slate-50/95 px-3 py-3 text-left font-semibold text-[#0b1f3a] sm:px-4">
              Feature
            </th>
            {plans.map((p) => (
              <th
                key={p.id}
                className="px-3 py-3 text-center font-semibold text-[#0b1f3a] sm:px-4"
              >
                <span className="block">{p.name}</span>
                {p.ribbon || p.badge ? (
                  <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-primary">
                    {p.ribbon || p.badge}
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.name)} className="border-b border-border/70 last:border-0">
              <td className="sticky left-0 z-10 bg-white px-3 py-3 font-medium text-[#0b1f3a] sm:px-4">
                {row.name}
              </td>
              {plans.map((p) => {
                const val = row[p.id];
                return (
                  <td
                    key={p.id}
                    className="px-3 py-3 text-center text-muted-foreground sm:px-4"
                  >
                    {typeof val === "boolean" ? (
                      val ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Included" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label="Not included" />
                      )
                    ) : (
                      <span className="text-xs sm:text-sm">{String(val ?? "—")}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
