import type { BillingCycle } from "@/lib/commercial/types";

const STORAGE_KEY = "waamtech_plan_selection";

export type PlanSelection = {
  planId: string;
  plan: string;
  productSlug?: string;
  billingCycle: BillingCycle;
  price: number | null;
  discount: number | null;
  originalPrice?: number | null;
  savings?: number | null;
  currency?: string | null;
  selectedAt: string;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function savePlanSelection(selection: Omit<PlanSelection, "selectedAt">): PlanSelection {
  const payload: PlanSelection = {
    ...selection,
    selectedAt: new Date().toISOString(),
  };
  if (canUseStorage()) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota / private mode */
    }
  }
  return payload;
}

export function readPlanSelection(): PlanSelection | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlanSelection;
    if (!parsed?.planId || !parsed?.billingCycle) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlanSelection(): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function parseBillingCycle(value: string | null | undefined): BillingCycle | null {
  const v = String(value || "").toLowerCase().trim();
  if (v === "monthly" || v === "yearly" || v === "lifetime") return v;
  return null;
}
