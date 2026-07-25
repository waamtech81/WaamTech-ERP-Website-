"use client";

import { Check, Minus } from "lucide-react";
import type { PricingPlan } from "@/types";
import { CatalogSkeleton } from "@/components/commercial/catalog-states";

type PricingComparisonTableProps = {
  plans: PricingPlan[];
  rows: Array<Record<string, string | boolean>>;
  loading?: boolean;
  hierarchyNote?: string | null;
};

export function PricingComparisonTable({
  plans,
  rows,
  loading,
  hierarchyNote = "Each plan includes everything from the previous plan plus additional features.",
}: PricingComparisonTableProps) {
  if (loading) {
    return <CatalogSkeleton rows={2} className="xl:grid-cols-1" />;
  }

  if (!plans.length || !rows.length) return null;

  return (
    <div className="space-y-3">
      {hierarchyNote ? (
        <p className="text-center text-sm text-muted-foreground">
          {hierarchyNote}
        </p>
      ) : null}

      {/*
        Sticky header lives inside this scrollport so it sticks while the table
        scrolls and naturally unsticks when the table leaves the viewport.
      */}
      <div className="max-h-[min(70vh,40rem)] overflow-auto rounded-2xl border border-border bg-white -mx-1 px-1 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 top-0 z-30 bg-slate-50 px-3 py-3 text-left font-semibold text-[#0b1f3a] shadow-[0_1px_0_0_rgba(15,23,42,0.08)] sm:px-4">
                Feature
              </th>
              {plans.map((p) => (
                <th
                  key={p.id}
                  className="bg-slate-50 px-3 py-3 text-center font-semibold text-[#0b1f3a] shadow-[0_1px_0_0_rgba(15,23,42,0.08)] sm:px-4"
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
            {rows.map((row, index) => {
              if (row.__section === true) {
                return (
                  <tr key={`section-${index}-${String(row.name)}`}>
                    <td
                      colSpan={plans.length + 1}
                      className="border-b border-border/70 bg-slate-50/90 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#0b1f3a]/75 sm:px-4"
                    >
                      {row.name}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={`feature-${index}-${String(row.name)}`}>
                  <td className="sticky left-0 z-10 border-b border-border/70 bg-white px-3 py-3 font-medium text-[#0b1f3a] sm:px-4">
                    {row.name}
                  </td>
                  {plans.map((p) => {
                    const val = row[p.id];
                    return (
                      <td
                        key={p.id}
                        className="border-b border-border/70 bg-white px-3 py-3 text-center text-muted-foreground sm:px-4"
                      >
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check
                              className="mx-auto h-4 w-4 text-emerald-600"
                              aria-label="Included"
                            />
                          ) : (
                            <Minus
                              className="mx-auto h-4 w-4 text-slate-300"
                              aria-label="Not included"
                            />
                          )
                        ) : (
                          <span className="text-xs sm:text-sm">
                            {String(val ?? "—")}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
