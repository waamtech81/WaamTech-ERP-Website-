"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useCatalogBundle } from "@/hooks/use-commercial";
import {
  cardPlans,
  publicMarketingPlans,
  resolveCyclePrice,
} from "@/lib/commercial/mappers";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalPanel, PortalSkeleton } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/providers/locale-provider";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import type { PricingPlan } from "@/types";
import type { BillingCycle } from "@/lib/commercial/types";

function planSortPrice(plan: PricingPlan, yearly: boolean): number {
  const cycle = resolveCyclePrice(plan, yearly);
  if (cycle.price == null) return Number.POSITIVE_INFINITY;
  return cycle.price;
}

function checkoutHrefFromPayload(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const checkout =
    row.checkout && typeof row.checkout === "object"
      ? (row.checkout as Record<string, unknown>)
      : row;
  const token = String(checkout.session_token || "").trim();
  if (token) return `/portal/checkout?session=${encodeURIComponent(token)}`;
  const url = String(checkout.checkout_url || "").trim();
  if (url.startsWith("/portal/")) return url;
  if (url.includes("/portal/checkout")) {
    try {
      const parsed = new URL(url, window.location.origin);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function PortalPlansView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent =
    searchParams.get("intent") === "upgrade" ? "upgrade" : "renew";
  const { data: portal, loading: portalLoading } = usePortalContext();
  const catalog = useCatalogBundle();
  const { formatPrice } = useLocale();
  const [yearly, setYearly] = useState(true);
  const [renewPeriod, setRenewPeriod] = useState<"monthly" | "yearly" | "lifetime">(
    "yearly"
  );
  const [pending, startTransition] = useTransition();
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const subscriptions = portal?.subscriptions || [];
  const requestedSubId = searchParams.get("subscription_id");
  const activeSub =
    (requestedSubId
      ? subscriptions.find((s) => s.id === requestedSubId)
      : null) ||
    subscriptions.find((s) =>
      ["active", "trial", "trialing", "grace", "suspended"].includes(
        String(s.status || "").toLowerCase()
      )
    ) ||
    subscriptions[0] ||
    null;

  const isTrial = String(activeSub?.status || "").toLowerCase() === "trial";

  const pricingPlans = useMemo(
    () => publicMarketingPlans(catalog.data.pricingPlans || []),
    [catalog.data.pricingPlans]
  );

  const displayPlans = useMemo(() => {
    const cards = cardPlans(pricingPlans).filter(
      (p) => !/enterprise/i.test(p.id) && p.planId
    );
    if (intent !== "upgrade" || !activeSub?.plan_id) return cards;

    const current = cards.find((p) => p.planId === activeSub.plan_id);
    const currentPrice = current
      ? planSortPrice(current, yearly)
      : Number(activeSub.unit_price) || 0;

    return cards.filter((p) => {
      if (p.planId === activeSub.plan_id) return false;
      return planSortPrice(p, yearly) > currentPrice;
    });
  }, [pricingPlans, intent, activeSub, yearly]);

  const comparePlans = useMemo(
    () => displayPlans.filter((p) => p.planId && compareIds.includes(p.planId)),
    [displayPlans, compareIds]
  );

  function toggleCompare(planId: string) {
    setCompareIds((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : prev.length >= 3
          ? prev
          : [...prev, planId]
    );
  }

  async function startFlow(plan: PricingPlan) {
    if (!activeSub?.id || !plan.planId || pending) return;
    setError("");
    setBusyPlanId(plan.planId);

    startTransition(async () => {
      try {
        const isRenewCurrent =
          intent === "renew" && plan.planId === activeSub.plan_id;

        const useTrialConvert = isTrial && (isRenewCurrent || intent === "renew");

        const res = await fetch(
          isRenewCurrent && !useTrialConvert
            ? "/api/portal/billing/renew"
            : "/api/portal/billing/plan-change",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify(
              useTrialConvert
                ? {
                    subscription_id: activeSub.id,
                    to_plan_id: plan.planId,
                    billing_cycle: renewPeriod,
                    mode: "trial-convert",
                  }
                : isRenewCurrent
                  ? { subscription_id: activeSub.id }
                  : {
                      subscription_id: activeSub.id,
                      to_plan_id: plan.planId,
                    }
            ),
          }
        );
        const json = await res.json();
        if (!json.success) {
          setError(apiMessageFromJson(json, "Unable to continue. Please try again."));
          setBusyPlanId(null);
          return;
        }

        if (json.data?.applied === true) {
          router.push("/portal/checkout/success?applied=1");
          return;
        }

        const href = checkoutHrefFromPayload(json.data);
        if (href) {
          router.push(href);
          return;
        }

        setError("Checkout session was not returned. Please contact support.");
        setBusyPlanId(null);
      } catch (err) {
        setError(friendlyNetworkError(err, "Unable to continue. Please try again."));
        setBusyPlanId(null);
      }
    });
  }

  if (portalLoading || catalog.loading) {
    return <PortalSkeleton rows={3} />;
  }

  if (!activeSub) {
    return (
      <PortalPanel
        title={intent === "upgrade" ? "Upgrade plan" : "Renew subscription"}
        description="No active subscription was found for this account."
      >
        <Button asChild className="rounded-xl">
          <Link href="/portal/subscriptions">Back to subscriptions</Link>
        </Button>
      </PortalPanel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/portal/subscriptions"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--portal-muted)] hover:text-[var(--portal-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Subscriptions
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--portal-fg)]">
            {intent === "upgrade" ? "Upgrade your plan" : "Renew your plan"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--portal-muted)]">
            Choose a plan below. Checkout stays inside your customer portal —
            you will not leave this workspace.
          </p>
          <p className="mt-2 text-sm text-[var(--portal-fg)]">
            Current plan:{" "}
            <span className="font-semibold">
              {activeSub.plan_name || portal?.subscription?.currentPlan || "—"}
            </span>
            {activeSub.expiry_date || activeSub.renewal_date ? (
              <span className="text-[var(--portal-muted)]">
                {" "}
                · Expires{" "}
                {String(activeSub.expiry_date || activeSub.renewal_date).slice(0, 10)}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {intent === "renew" || isTrial ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-panel)] px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                Period
              </span>
              {(["monthly", "yearly", "lifetime"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => {
                    setRenewPeriod(period);
                    setYearly(period !== "monthly");
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                    renewPeriod === period
                      ? "bg-[var(--portal-primary)] text-white"
                      : "text-[var(--portal-muted)] hover:bg-[var(--portal-soft)]"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-panel)] px-4 py-3">
              <Label htmlFor="portal-billing-cycle" className="text-sm">
                Monthly
              </Label>
              <Switch
                id="portal-billing-cycle"
                checked={yearly}
                onCheckedChange={setYearly}
              />
              <Label htmlFor="portal-billing-cycle" className="text-sm">
                Yearly
              </Label>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      ) : null}

      {comparePlans.length >= 2 ? (
        <PortalPanel title="Plan comparison" description="Side-by-side features and pricing.">
          <div className="portal-table-wrap">
            <table className="portal-table">
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {comparePlans.map((p) => (
                    <th key={p.planId} scope="col">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Price</td>
                  {comparePlans.map((p) => {
                    const cycle = resolveCyclePrice(p, yearly);
                    return (
                      <td key={p.planId} className="tabular-nums">
                        {cycle.price != null ? formatPrice(cycle.price) : "Custom"}
                      </td>
                    );
                  })}
                </tr>
                {Array.from(
                  new Set(comparePlans.flatMap((p) => (p.features || []).slice(0, 8)))
                )
                  .slice(0, 10)
                  .map((feature) => (
                    <tr key={feature}>
                      <td>{feature}</td>
                      {comparePlans.map((p) => (
                        <td key={p.planId}>
                          {(p.features || []).includes(feature) ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <span className="text-[var(--portal-muted)]">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </PortalPanel>
      ) : null}

      {!displayPlans.length ? (
        <PortalPanel
          title="No plans available"
          description={
            intent === "upgrade"
              ? "There is no higher plan available for upgrade right now."
              : "Plans could not be loaded. Please try again shortly."
          }
        >
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/portal/notifications">View notifications</Link>
          </Button>
        </PortalPanel>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayPlans.map((plan) => {
            const cycle = resolveCyclePrice(plan, yearly);
            const isCurrent = plan.planId === activeSub.plan_id;
            const busy = busyPlanId === plan.planId && pending;
            const ctaLabel =
              intent === "renew" && isCurrent
                ? "Renew this plan"
                : intent === "upgrade"
                  ? "Upgrade to this plan"
                  : isCurrent
                    ? "Renew this plan"
                    : "Upgrade to this plan";

            return (
              <article
                key={plan.planId || plan.id}
                className={`flex flex-col rounded-2xl border bg-[var(--portal-panel)] p-5 shadow-sm ${
                  isCurrent
                    ? "border-[var(--portal-primary)] ring-1 ring-[var(--portal-primary)]/20"
                    : "border-[var(--portal-border)]"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--portal-fg)]">
                      {plan.name}
                    </h2>
                    {plan.subtitle ? (
                      <p className="mt-1 text-sm text-[var(--portal-muted)]">
                        {plan.subtitle}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isCurrent ? (
                      <span className="rounded-full bg-[var(--portal-primary-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-primary)]">
                        Current
                      </span>
                    ) : null}
                    {plan.planId ? (
                      <button
                        type="button"
                        onClick={() => toggleCompare(plan.planId!)}
                        className="text-xs font-medium text-[var(--portal-primary)] hover:underline"
                      >
                        {compareIds.includes(plan.planId) ? "Remove compare" : "Compare"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mb-4">
                  {cycle.price != null ? (
                    <p className="text-3xl font-semibold tabular-nums text-[var(--portal-fg)]">
                      {formatPrice(cycle.price)}
                      <span className="ml-1 text-sm font-normal text-[var(--portal-muted)]">
                        {cycle.billingCycle === "lifetime"
                          ? "one-time"
                          : "/user/mo"}
                      </span>
                    </p>
                  ) : (
                    <p className="text-2xl font-semibold">Custom</p>
                  )}
                  <p className="mt-1 text-xs capitalize text-[var(--portal-muted)]">
                    Billing: {cycle.billingCycle as BillingCycle}
                  </p>
                </div>

                <ul className="mb-6 flex-1 space-y-2">
                  {(plan.features || []).slice(0, 6).map((f) => (
                    <li
                      key={f}
                      className="flex gap-2 text-sm text-[var(--portal-muted)]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  className="w-full rounded-xl"
                  disabled={pending || cycle.contactSales}
                  onClick={() => void startFlow(plan)}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting…
                    </>
                  ) : cycle.contactSales ? (
                    "Contact sales"
                  ) : (
                    ctaLabel
                  )}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
