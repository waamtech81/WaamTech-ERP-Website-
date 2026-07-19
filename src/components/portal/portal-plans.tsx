"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import {
  useCatalogBundle,
  useCatalogBusinessCategories,
  useCatalogBusinessProfiles,
  useCatalogIndustries,
} from "@/hooks/use-commercial";
import {
  cardPlans,
  publicMarketingPlans,
  resolveCyclePrice,
} from "@/lib/commercial/mappers";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalPanel, PortalSkeleton, PortalStatusBadge } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/providers/locale-provider";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { cn } from "@/lib/utils";
import type { PricingPlan } from "@/types";
import type { BillingCycle } from "@/lib/commercial/types";

type FlowMode = "upgrade" | "new_place" | "renew";
type Step = "mode" | "industry" | "category" | "plan" | "confirm";

function priceForCycle(plan: PricingPlan, cycle: BillingCycle) {
  if (cycle === "lifetime" && plan.lifetimePrice != null) {
    return {
      billingCycle: "lifetime" as BillingCycle,
      price: plan.lifetimePrice,
      contactSales: Boolean(plan.contactSales),
      unitLabel: "one-time",
    };
  }
  const resolved = resolveCyclePrice(plan, cycle !== "monthly");
  return {
    billingCycle: (resolved.billingCycle || cycle) as BillingCycle,
    price: resolved.price,
    contactSales: Boolean(resolved.contactSales),
    unitLabel: resolved.unitLabel || "/user/mo",
  };
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
  const intentParam = searchParams.get("intent");
  const initialMode: FlowMode =
    intentParam === "new_place" || intentParam === "add"
      ? "new_place"
      : intentParam === "upgrade"
        ? "upgrade"
        : "renew";

  const { data: portal, loading: portalLoading } = usePortalContext();
  const catalog = useCatalogBundle();
  const industriesQuery = useCatalogIndustries();
  const { formatPrice } = useLocale();

  const [mode, setMode] = useState<FlowMode>(initialMode);
  const [step, setStep] = useState<Step>(
    initialMode === "renew" ? "plan" : "mode"
  );
  const [industryId, setIndustryId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [companyName, setCompanyName] = useState("");
  const [gatewayId, setGatewayId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const categoriesQuery = useCatalogBusinessCategories(industryId || null);
  const profilesQuery = useCatalogBusinessProfiles(categoryId || null);

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
  const gateways = (portal?.gateways || []).filter((g) => g.configured || g.online);

  useEffect(() => {
    setMode(initialMode);
    setStep(initialMode === "renew" ? "plan" : "mode");
  }, [initialMode]);

  useEffect(() => {
    if (!gatewayId && gateways[0]?.id) setGatewayId(gateways[0].id);
  }, [gateways, gatewayId]);

  useEffect(() => {
    // Prefill industry/category from current business when upgrading.
    if (mode !== "upgrade" && mode !== "renew") return;
    const industryName = portal?.overview.industry || portal?.businesses?.[0]?.industry;
    const categoryName =
      portal?.overview.businessCategory || portal?.businesses?.[0]?.category;
    const industries = industriesQuery.data || [];
    if (!industryId && industryName && industries.length) {
      const match = industries.find(
        (i) => i.name.toLowerCase() === String(industryName).toLowerCase()
      );
      if (match) setIndustryId(match.id);
    }
    const categories = categoriesQuery.data || [];
    if (industryId && !categoryId && categoryName && categories.length) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === String(categoryName).toLowerCase()
      );
      if (match) setCategoryId(match.id);
    }
  }, [
    mode,
    portal,
    industriesQuery.data,
    categoriesQuery.data,
    industryId,
    categoryId,
  ]);

  const pricingPlans = useMemo(
    () => publicMarketingPlans(catalog.data.pricingPlans || []),
    [catalog.data.pricingPlans]
  );

  const displayPlans = useMemo(() => {
    const cards = cardPlans(pricingPlans).filter(
      (p) => !/enterprise/i.test(p.id) && p.planId
    );
    // Always show the full License catalog list for upgrade / renew / new place.
    return cards;
  }, [pricingPlans]);

  const selectedPlan =
    displayPlans.find((p) => p.planId === selectedPlanId) || null;
  const selectedPrice = selectedPlan
    ? priceForCycle(selectedPlan, billingCycle)
    : null;

  const industries = (industriesQuery.data || []).filter(
    (i) => i.is_public !== false && String(i.status || "active").toLowerCase() !== "inactive"
  );
  const categories = (categoriesQuery.data || []).filter(
    (c) => c.is_public !== false && String(c.status || "active").toLowerCase() !== "inactive"
  );
  const profiles = profilesQuery.data || [];

  function goNextFromMode(next: FlowMode) {
    setMode(next);
    setError("");
    if (next === "renew") {
      setStep("plan");
      return;
    }
    setStep("industry");
  }

  async function subscribe() {
    if (!selectedPlan?.planId || pending) return;
    setError("");

    if ((mode === "upgrade" || mode === "new_place") && (!industryId || !categoryId)) {
      setError("Choose industry and category before continuing.");
      setStep(!industryId ? "industry" : "category");
      return;
    }

    if (mode === "upgrade" && !activeSub?.id) {
      setError("No active subscription found to upgrade.");
      return;
    }

    if (mode === "renew" && !activeSub?.id) {
      setError("No active subscription found to renew.");
      return;
    }

    startTransition(async () => {
      try {
        const isRenewCurrent =
          mode === "renew" && selectedPlan.planId === activeSub?.plan_id;
        const useTrialConvert =
          isTrial && (mode === "renew" || mode === "upgrade");

        const payload: Record<string, unknown> = {
          mode: useTrialConvert
            ? "trial-convert"
            : isRenewCurrent
              ? "renew"
              : mode === "new_place"
                ? "new_place"
                : "upgrade",
          plan_id: selectedPlan.planId,
          to_plan_id: selectedPlan.planId,
          product_id: selectedPlan.productId,
          billing_cycle: billingCycle,
          industry_id: industryId || undefined,
          category_id: categoryId || undefined,
          business_profile_id: profileId || undefined,
          gateway: gatewayId || undefined,
          company_name: companyName.trim() || undefined,
          subscription_id: activeSub?.id,
        };

        const res = await fetch("/api/portal/billing/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) {
          setError(apiMessageFromJson(json, "Unable to continue. Please try again."));
          return;
        }

        if (json.data?.applied === true) {
          router.push(
            `/portal/checkout/success?applied=1&mode=${encodeURIComponent(mode)}`
          );
          return;
        }

        const href = checkoutHrefFromPayload(json.data);
        if (href) {
          const sep = href.includes("?") ? "&" : "?";
          router.push(
            `${href}${sep}mode=${encodeURIComponent(mode)}&plan=${encodeURIComponent(
              selectedPlan.name
            )}`
          );
          return;
        }

        setError("Checkout session was not returned. Please contact support.");
      } catch (err) {
        setError(friendlyNetworkError(err, "Unable to continue. Please try again."));
      }
    });
  }

  if (portalLoading || catalog.loading) {
    return <PortalSkeleton rows={3} />;
  }

  if ((mode === "upgrade" || mode === "renew") && !activeSub) {
    return (
      <PortalPanel
        title="No subscription found"
        description="Add a new place to create another subscription on this account, or contact support."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => goNextFromMode("new_place")}
          >
            Add new place
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/portal/subscriptions">Back to subscriptions</Link>
          </Button>
        </div>
      </PortalPanel>
    );
  }

  const title =
    mode === "new_place"
      ? "Add a new place"
      : mode === "upgrade"
        ? "Upgrade your plan"
        : "Renew your plan";

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
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--portal-muted)]">
            Choose industry, category, plan, and price. Then continue to billing
            checkout with your preferred payment method. License Engine stays the
            source of truth — SaaS picks up the update after payment.
          </p>
          {activeSub && mode !== "new_place" ? (
            <p className="mt-2 text-sm text-[var(--portal-fg)]">
              Current plan:{" "}
              <span className="font-semibold">
                {activeSub.plan_name || portal?.subscription?.currentPlan || "—"}
              </span>
              <PortalStatusBadge status={activeSub.status} className="ml-2" />
            </p>
          ) : null}
        </div>
      </div>

      {/* Steps */}
      <ol className="flex flex-wrap gap-2 text-xs font-medium">
        {(
          [
            ["mode", "1. Action"],
            ["industry", "2. Industry"],
            ["category", "3. Category"],
            ["plan", "4. Plan & price"],
            ["confirm", "5. Subscribe"],
          ] as const
        ).map(([key, label]) => (
          <li
            key={key}
            className={cn(
              "rounded-full border px-3 py-1.5",
              step === key
                ? "border-[var(--portal-primary)] bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
                : "border-[var(--portal-border)] text-[var(--portal-muted)]"
            )}
          >
            {label}
          </li>
        ))}
      </ol>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      ) : null}

      {step === "mode" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => goNextFromMode("upgrade")}
            className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5 text-left hover:border-[var(--portal-primary)]"
          >
            <Sparkles className="h-5 w-5 text-[var(--portal-primary)]" />
            <p className="mt-3 text-sm font-semibold">Upgrade current plan</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              Keep this business and move to a higher plan. Payment opens on billing
              checkout.
            </p>
          </button>
          <button
            type="button"
            onClick={() => goNextFromMode("new_place")}
            className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5 text-left hover:border-[var(--portal-primary)]"
          >
            <Building2 className="h-5 w-5 text-[var(--portal-primary)]" />
            <p className="mt-3 text-sm font-semibold">Add new place</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              Add another business on the same account. After payment, it syncs to
              License and appears in app.waamto.com multi-business.
            </p>
          </button>
          <button
            type="button"
            onClick={() => goNextFromMode("renew")}
            className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5 text-left hover:border-[var(--portal-primary)]"
          >
            <RefreshCw className="h-5 w-5 text-[var(--portal-primary)]" />
            <p className="mt-3 text-sm font-semibold">Renew subscription</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              Renew the current plan period, or switch plan while renewing.
            </p>
          </button>
        </div>
      ) : null}

      {step === "industry" ? (
        <PortalPanel
          title="Choose industry"
          description="Fetched live from License Engine catalog."
        >
          {industriesQuery.loading ? (
            <PortalSkeleton rows={1} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {industries.map((industry) => (
                <button
                  key={industry.id}
                  type="button"
                  onClick={() => {
                    setIndustryId(industry.id);
                    setCategoryId("");
                    setProfileId("");
                    setStep("category");
                  }}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm",
                    industryId === industry.id
                      ? "border-[var(--portal-primary)] bg-[var(--portal-primary-soft)]"
                      : "border-[var(--portal-border)] bg-[var(--portal-soft)] hover:border-[var(--portal-primary)]/50"
                  )}
                >
                  <p className="font-semibold text-[var(--portal-fg)]">{industry.name}</p>
                  {industry.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--portal-muted)]">
                      {industry.description}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStep("mode")}>
              Back
            </Button>
          </div>
        </PortalPanel>
      ) : null}

      {step === "category" ? (
        <PortalPanel
          title="Choose category"
          description="Categories for the selected industry."
        >
          {categoriesQuery.loading ? (
            <PortalSkeleton rows={1} />
          ) : categories.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(category.id);
                    setProfileId("");
                    setStep("plan");
                  }}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm",
                    categoryId === category.id
                      ? "border-[var(--portal-primary)] bg-[var(--portal-primary-soft)]"
                      : "border-[var(--portal-border)] bg-[var(--portal-soft)] hover:border-[var(--portal-primary)]/50"
                  )}
                >
                  <p className="font-semibold text-[var(--portal-fg)]">{category.name}</p>
                  {category.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--portal-muted)]">
                      {category.description}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--portal-muted)]">
              No categories found for this industry.
            </p>
          )}
          {profiles.length > 1 ? (
            <div className="mt-5 space-y-2">
              <Label htmlFor="bp-profile">Business profile (optional)</Label>
              <select
                id="bp-profile"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3 text-sm"
              >
                <option value="">Auto from category</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStep("industry")}>
              Back
            </Button>
          </div>
        </PortalPanel>
      ) : null}

      {step === "plan" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--portal-fg)]">
                Plans from License catalog
              </h2>
              <p className="text-xs text-[var(--portal-muted)]">
                Pick a plan, then choose monthly / yearly / lifetime pricing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-panel)] px-3 py-2">
              {(["monthly", "yearly", "lifetime"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setBillingCycle(period)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm capitalize",
                    billingCycle === period
                      ? "bg-[var(--portal-primary)] text-white"
                      : "text-[var(--portal-muted)] hover:bg-[var(--portal-soft)]"
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {!displayPlans.length ? (
            <PortalPanel
              title="No plans available"
              description="Plans could not be loaded from License Engine."
            >
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/portal/notifications">View notifications</Link>
              </Button>
            </PortalPanel>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {displayPlans.map((plan) => {
                const cycle = priceForCycle(plan, billingCycle);
                const isCurrent = plan.planId === activeSub?.plan_id;
                const selected = plan.planId === selectedPlanId;
                return (
                  <article
                    key={plan.planId || plan.id}
                    className={cn(
                      "flex flex-col rounded-2xl border bg-[var(--portal-panel)] p-5 shadow-sm",
                      selected
                        ? "border-[var(--portal-primary)] ring-1 ring-[var(--portal-primary)]/20"
                        : "border-[var(--portal-border)]"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      {isCurrent ? (
                        <span className="rounded-full bg-[var(--portal-primary-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-primary)]">
                          Current
                        </span>
                      ) : null}
                    </div>
                    {cycle.price != null ? (
                      <p className="text-3xl font-semibold tabular-nums">
                        {formatPrice(cycle.price)}
                        <span className="ml-1 text-sm font-normal text-[var(--portal-muted)]">
                          {cycle.unitLabel}
                        </span>
                      </p>
                    ) : (
                      <p className="text-2xl font-semibold">Custom</p>
                    )}
                    <p className="mt-1 text-xs capitalize text-[var(--portal-muted)]">
                      Billing: {cycle.billingCycle}
                    </p>
                    <ul className="my-4 flex-1 space-y-2">
                      {(plan.features || []).slice(0, 5).map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-[var(--portal-muted)]">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      className="w-full rounded-xl"
                      variant={selected ? "default" : "outline"}
                      disabled={cycle.contactSales}
                      onClick={() => {
                        if (!plan.planId) return;
                        setSelectedPlanId(plan.planId);
                        setStep("confirm");
                      }}
                    >
                      {cycle.contactSales
                        ? "Contact sales"
                        : selected
                          ? "Selected"
                          : "Select this plan"}
                    </Button>
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                setStep(mode === "renew" ? "mode" : "category")
              }
            >
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === "confirm" && selectedPlan ? (
        <PortalPanel
          title="Confirm & go to billing"
          description="Review your selection, choose a payment method, then continue to checkout."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm">
              <p className="text-[11px] uppercase tracking-wide text-[var(--portal-muted)]">
                Action
              </p>
              <p className="mt-1 font-medium capitalize">
                {mode === "new_place" ? "Add new place" : mode}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm">
              <p className="text-[11px] uppercase tracking-wide text-[var(--portal-muted)]">
                Plan
              </p>
              <p className="mt-1 font-medium">{selectedPlan.name}</p>
            </div>
            <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm">
              <p className="text-[11px] uppercase tracking-wide text-[var(--portal-muted)]">
                Industry / category
              </p>
              <p className="mt-1 font-medium">
                {(industries.find((i) => i.id === industryId)?.name || "—") +
                  " · " +
                  (categories.find((c) => c.id === categoryId)?.name || "—")}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm">
              <p className="text-[11px] uppercase tracking-wide text-[var(--portal-muted)]">
                Price
              </p>
              <p className="mt-1 font-medium tabular-nums">
                {selectedPrice?.price != null
                  ? `${formatPrice(selectedPrice.price)} (${billingCycle})`
                  : "Custom"}
              </p>
            </div>
          </div>

          {mode === "new_place" ? (
            <div className="mt-4 space-y-2">
              <Label htmlFor="place-name">New place / business name (optional)</Label>
              <Input
                id="place-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-11 bg-[var(--portal-soft)]"
                placeholder="e.g. Downtown branch"
              />
            </div>
          ) : null}

          {gateways.length ? (
            <div className="mt-4 space-y-2">
              <Label htmlFor="pay-gateway">Payment method</Label>
              <select
                id="pay-gateway"
                value={gatewayId}
                onChange={(e) => setGatewayId(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3 text-sm"
              >
                {gateways.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label || g.id}
                    {g.online ? " · Online" : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mt-4 text-xs text-[var(--portal-muted)]">
              Payment gateway will be selected automatically at checkout.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-xl"
              disabled={pending}
              onClick={() => void subscribe()}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting checkout…
                </>
              ) : (
                "Subscribe & pay"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setStep("plan")}
            >
              Change plan
            </Button>
          </div>
        </PortalPanel>
      ) : null}
    </div>
  );
}
