"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Boxes,
  Check,
  CreditCard,
  ExternalLink,
  FileText,
  Gauge,
  History,
  KeyRound,
  LifeBuoy,
  Loader2,
  Package,
  Puzzle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { formatPortalDate } from "@/components/portal/use-portal-data";
import { formatPortalRenewalLabel } from "@/lib/portal/display-labels";
import { PortalLicenseEntitlements } from "@/components/portal/portal-license-detail";
import { PortalCustomErpRenewButton } from "@/components/portal/portal-custom-erp-renew";
import { PortalDashboardPayBanner } from "@/components/portal/portal-dashboard-pay-banner";
import {
  PortalEmptyState,
  PortalErrorState,
  PortalFadeIn,
  PortalPageHeader,
  PortalPanel,
  PortalSkeleton,
  PortalStatCard,
  PortalStatusBadge,
  PortalUsageMeter,
} from "@/components/portal/portal-ui";
import type { PortalDashboard } from "@/lib/portal/dashboard";
import {
  primaryPortalLicense,
  resolvePrimaryBillingCycle,
  showRenewalUi,
} from "@/lib/portal/package-type";
import { authConfig } from "@/lib/auth/config";
import { fetchPublicModules } from "@/lib/commercial/client";
import { useLocale } from "@/components/providers/locale-provider";
import { resolvePurchasedLimits } from "@/lib/portal/commercial-snapshot";
import { cn } from "@/lib/utils";

function titleCaseCode(code: string) {
  const c = String(code || "").trim();
  if (!c) return "—";
  const map: Record<string, string> = {
    pos: "POS",
    crm: "CRM",
    hr: "HR",
    wms: "WMS",
    ai: "AI",
  };
  const key = c.toLowerCase();
  if (map[key]) return map[key];
  return c
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function formatBillingCycleLabel(cycle?: string | null) {
  const raw = String(cycle || "").trim();
  if (!raw) return "—";
  if (/lifetime|one.?time|once/i.test(raw)) return "Lifetime";
  if (/year/i.test(raw)) return "Yearly";
  if (/month/i.test(raw)) return "Monthly";
  return titleCaseCode(raw);
}

function activeSubscription(data: PortalDashboard) {
  return (
    data.subscriptions?.find((s) =>
      ["active", "trial", "trialing", "grace", "suspended"].includes(
        String(s.status || "").toLowerCase()
      )
    ) ||
    data.subscriptions?.[0] ||
    null
  );
}

function resolveUsage(data: PortalDashboard) {
  const primary = primaryPortalLicense(data.licenses);
  const limits = resolvePurchasedLimits(
    data.commercialSnapshot,
    primary?.tenant_limits || null
  );
  const erp = (data.erp || {}) as Record<string, unknown>;
  const erpCounts = (erp.counts || erp) as Record<string, unknown>;

  const num = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

  return [
    {
      label: "Users",
      used: data.counts.registeredUsers ?? data.workspaceUsers.length ?? null,
      max: limits.users,
    },
    {
      label: "Companies",
      used: data.counts.registeredBusinesses ?? num(erpCounts.companies) ?? num(erpCounts.businesses),
      max: limits.companies,
    },
    {
      label: "Branches",
      used: num(erpCounts.branches),
      max: limits.branches,
    },
    {
      label: "Warehouses",
      used: num(erpCounts.warehouses),
      max: limits.warehouses,
    },
    {
      label: "Storage",
      used: num(erpCounts.storage) ?? num(erpCounts.storage_gb),
      max: limits.storage ?? null,
    },
    {
      label: "API",
      used: num(erpCounts.api) ?? num(erpCounts.api_calls),
      max: limits.api ?? null,
    },
  ];
}

export type CustomErpSectionKey =
  | "modules"
  | "feature-packs"
  | "limits"
  | "custom-erp"
  | "support"
  | "subscription"
  | "license";

/** Custom ERP customer dashboard — no predefined plan upgrade/compare surfaces. */
export function PortalCustomErpDashboardView() {
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={3} />;
  if (error || !data) {
    return <PortalErrorState message={error || "Something went wrong."} onRetry={reload} />;
  }

  const primary = primaryPortalLicense(data.licenses);
  const sub = activeSubscription(data);
  const billingCycle = resolvePrimaryBillingCycle(primary, data.subscriptions);
  const canRenew = showRenewalUi(billingCycle);
  const renewal =
    data.subscription?.renewalDate ||
    sub?.renewal_date ||
    data.billing?.nextInvoice ||
    primary?.expiry_date ||
    null;
  const moduleCount = primary?.modules?.length || data.modules.length;
  const packCount = primary?.feature_packs?.length || data.featurePacks.length;
  const usage = resolveUsage(data);
  const invoices = data.invoices || [];

  const actions = [
    {
      href: "/portal/modules",
      label: "Manage modules",
      hint: "Add or review installed modules",
      icon: Boxes,
    },
    {
      href: "/portal/feature-packs",
      label: "Feature packs",
      hint: "Active and available packs",
      icon: Puzzle,
    },
    {
      href: "/portal/limits",
      label: "Tenant limits",
      hint: "Users, companies, branches, warehouses",
      icon: Gauge,
    },
    {
      href: "/portal/custom-erp",
      label: "Modify ERP configuration",
      hint: "Quote preview · pricing changes",
      icon: SlidersHorizontal,
    },
    {
      href: "/portal/billing",
      label: "Billing & renewal",
      hint: canRenew ? "Subscription · invoices · payments" : "Invoices · payments",
      icon: CreditCard,
    },
    {
      href: "/portal/support",
      label: "Support",
      hint: "Tickets · documentation",
      icon: LifeBuoy,
    },
  ];

  return (
    <div className="space-y-6">
      <PortalDashboardPayBanner data={data} />
      <PortalPageHeader
        eyebrow="Custom ERP"
        title="Custom ERP Package"
        description="Your workspace was built from modules, feature packs, and limits — not a predefined Starter / Business / Enterprise plan."
        actions={
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => reload()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      <section
        aria-label="Custom ERP actions"
        className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-4 sm:p-5"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
          Package actions
        </p>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          Upgrade through modules, feature packs, and limits only — predefined plans are not offered.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {actions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="portal-focus-ring rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 transition hover:border-[var(--portal-primary)]/40 hover:bg-[var(--portal-primary-soft)]"
            >
              <div className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-4 w-4 text-[var(--portal-primary)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--portal-fg)]">{item.label}</p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">{item.hint}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard
          label="License status"
          value={String(primary?.effective_status || primary?.status || "—")}
          icon={KeyRound}
          href="/portal/licenses"
        />
        <PortalStatCard
          label="Subscription"
          value={String(sub?.status || data.subscription?.status || "—")}
          hint={formatBillingCycleLabel(billingCycle)}
          icon={Package}
          href="/portal/subscriptions"
        />
        <PortalStatCard
          label="Billing cycle"
          value={formatBillingCycleLabel(billingCycle)}
          icon={CreditCard}
          href="/portal/billing"
        />
        {canRenew ? (
          <PortalStatCard
            label="Renewal date"
            value={formatPortalDate(renewal) || "—"}
            icon={RefreshCw}
            href="/portal/billing"
          />
        ) : (
          <PortalStatCard
            label="Package type"
            value="Lifetime"
            hint="No renewal required"
            icon={RefreshCw}
            href="/portal/subscriptions"
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard
          label="Modules"
          value={String(moduleCount)}
          hint="Installed on this package"
          icon={Boxes}
          href="/portal/modules"
        />
        <PortalStatCard
          label="Feature packs"
          value={String(packCount)}
          hint="Active packs"
          icon={Puzzle}
          href="/portal/feature-packs"
        />
        <PortalStatCard
          label="Invoices"
          value={invoices.length ? String(invoices.length) : "—"}
          hint="Recent billing documents"
          icon={FileText}
          href="/portal/invoices"
        />
        <PortalStatCard
          label="Outstanding"
          value={data.billing?.outstandingBalance || "—"}
          hint="From License Engine"
          icon={CreditCard}
          href="/portal/billing"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <PortalFadeIn>
          <PortalPanel
            title="Custom ERP Package"
            description="Active license and package composition from License Engine."
            action={
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/portal/licenses">License detail</Link>
              </Button>
            }
          >
            {primary ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold tracking-tight">
                      {primary.product_name || "WAAMTO ERP"} · Custom ERP Package
                    </p>
                    <p className="mt-2 font-mono text-xs tracking-wide text-[var(--portal-muted)]">
                      {data.license?.keyMasked || primary.keyMasked || "—"}
                    </p>
                  </div>
                  <PortalStatusBadge status={primary.effective_status || primary.status} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Activation", value: formatPortalDate(primary.activation_date) },
                    ...(canRenew
                      ? [{ label: "Renewal / expiry", value: formatPortalDate(renewal) }]
                      : []),
                    {
                      label: "Days left",
                      value:
                        typeof primary.days_remaining === "number"
                          ? String(primary.days_remaining)
                          : null,
                    },
                  ]
                    .filter((r) => r.value)
                    .map((r) => (
                      <div
                        key={r.label}
                        className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3.5 py-3"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                          {r.label}
                        </p>
                        <p className="mt-1.5 text-sm font-medium">{r.value}</p>
                      </div>
                    ))}
                </div>
                <PortalLicenseEntitlements
                  license={primary}
                  industry={data.overview.industry}
                  category={data.overview.businessCategory}
                  billingCycleFallback={sub?.billing_cycle}
                />
                <div className="flex flex-wrap gap-2">
                  {canRenew ? (
                    <PortalCustomErpRenewButton
                      subscriptionId={sub?.id}
                      label="Renew now"
                    />
                  ) : null}
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href="/portal/modules">Add modules</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href="/portal/custom-erp">Modify configuration</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="rounded-xl">
                    <a
                      href={`${authConfig.appUrl.replace(/\/+$/, "")}/login?email=${encodeURIComponent(data.identity.email)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open ERP
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <PortalEmptyState
                title="No custom package license yet"
                description="Once License Engine issues your Custom ERP license, it will appear here."
                actionLabel="Open billing"
                actionHref="/portal/billing"
                icon={Package}
              />
            )}
          </PortalPanel>
        </PortalFadeIn>

        <PortalFadeIn>
          <PortalPanel title="Usage & limits" description="Current usage against entitlement caps.">
            <div className="space-y-3">
              {usage.map((row) =>
                row.max != null && row.max > 0 && row.used != null ? (
                  <PortalUsageMeter
                    key={row.label}
                    label={row.label}
                    used={Number(row.used)}
                    limit={Number(row.max)}
                  />
                ) : (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3.5 py-3"
                  >
                    <span className="text-sm text-[var(--portal-muted)]">{row.label}</span>
                    <span className="text-sm font-semibold">
                      {row.used != null ? `${row.used}` : "—"}
                      {row.max != null ? ` / ${row.max}` : row.max === null && row.used == null ? "" : ""}
                    </span>
                  </div>
                )
              )}
              <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
                <Link href="/portal/limits">
                  Manage limits
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </PortalPanel>
        </PortalFadeIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PortalPanel title="Recent changes" description="Payments, renewals, and invoices from License Engine.">
          {(data.activities || []).length ? (
            <ul className="space-y-2">
              {(data.activities || []).slice(0, 8).map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[var(--portal-border)] px-4 py-3 text-sm"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="shrink-0 text-xs text-[var(--portal-muted)]">
                    {formatPortalDate(item.created_at) || "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmptyState
              title="No recent activity"
              description="Billing events will appear here after your first payment or renewal."
            />
          )}
        </PortalPanel>

        <PortalPanel
          title="Recent invoices"
          action={
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/portal/invoices">View all</Link>
            </Button>
          }
        >
          {invoices.length ? (
            <div className="space-y-2">
              {invoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--portal-border)] px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{inv.number}</p>
                    <p className="text-xs text-[var(--portal-muted)]">
                      {formatPortalDate(inv.date) || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums font-medium">{inv.amount || "—"}</p>
                    <PortalStatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="No invoices yet"
              description="Invoices from License Engine billing will appear here."
              icon={CreditCard}
            />
          )}
        </PortalPanel>
      </div>
    </div>
  );
}

/** Dedicated Custom ERP portal sections. */
export function PortalCustomErpSectionView({ section }: { section: CustomErpSectionKey }) {
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={2} />;
  if (error || !data) {
    return <PortalErrorState message={error || "Something went wrong."} onRetry={reload} />;
  }

  const primary = primaryPortalLicense(data.licenses);
  const sub = activeSubscription(data);
  const billingCycle = resolvePrimaryBillingCycle(primary, data.subscriptions);
  const canRenew = showRenewalUi(billingCycle);
  const modules = primary?.modules?.length ? primary.modules : data.modules;
  const packs = primary?.feature_packs?.length ? primary.feature_packs : data.featurePacks;
  const limits = primary?.tenant_limits || {};
  const usage = resolveUsage(data);
  const renewal =
    data.subscription?.renewalDate ||
    sub?.renewal_date ||
    data.billing?.nextInvoice ||
    primary?.expiry_date ||
    null;

  if (section === "license") {
    return (
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow="Custom ERP"
          title="License"
          description="License ID, status, billing cycle, and package composition from License Engine."
        />
        {primary ? (
          <PortalPanel title="Active license" description="Custom ERP package entitlement.">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold tracking-tight">Custom ERP Package</p>
                  <p className="mt-2 text-sm text-[var(--portal-muted)]">
                    License ID · <span className="font-mono text-xs">{primary.id}</span>
                  </p>
                  <p className="mt-1 font-mono text-xs tracking-wide text-[var(--portal-muted)]">
                    {primary.keyMasked || "—"}
                  </p>
                </div>
                <PortalStatusBadge status={primary.effective_status || primary.status} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Status", value: primary.effective_status || primary.status },
                  { label: "Expires", value: formatPortalDate(primary.expiry_date) },
                  { label: "Billing cycle", value: formatBillingCycleLabel(billingCycle) },
                  ...(canRenew
                    ? [{ label: "Renewal", value: formatPortalDate(renewal) }]
                    : []),
                  { label: "Activated", value: formatPortalDate(primary.activation_date) },
                  { label: "Current package", value: "Custom ERP Package" },
                  {
                    label: "Version",
                    value: String((data.erp as Record<string, unknown> | null)?.version || "—"),
                  },
                ]
                  .filter((r) => r.value && r.value !== "—")
                  .map((r) => (
                    <div
                      key={r.label}
                      className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3.5 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                        {r.label}
                      </p>
                      <p className="mt-1.5 text-sm font-medium capitalize">{r.value}</p>
                    </div>
                  ))}
              </div>
              <PortalLicenseEntitlements
                license={primary}
                industry={data.overview.industry}
                category={data.overview.businessCategory}
                billingCycleFallback={sub?.billing_cycle}
              />
              {data.renewals?.length ? (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <History className="h-4 w-4" />
                    License history
                  </p>
                  <div className="portal-table-wrap">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th scope="col">Renewal</th>
                          <th scope="col">Status</th>
                          <th scope="col">Date</th>
                          <th scope="col">New expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.renewals.slice(0, 10).map((r) => (
                          <tr key={r.id}>
                            <td className="font-medium">{formatPortalRenewalLabel(r)}</td>
                            <td>
                              <PortalStatusBadge status={r.status} />
                            </td>
                            <td>{formatPortalDate(r.renewal_date) || "—"}</td>
                            <td>{formatPortalDate(r.new_expiry) || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </PortalPanel>
        ) : (
          <PortalEmptyState
            title="No license found"
            description="Your Custom ERP license will appear when issued by License Engine."
            actionLabel="Open billing"
            actionHref="/portal/billing"
          />
        )}
      </div>
    );
  }

  if (section === "subscription") {
    const paymentStatus =
      data.payments?.[0]?.status ||
      sub?.status ||
      data.subscription?.status ||
      primary?.effective_status ||
      "—";

    return (
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow="Custom ERP"
          title="Subscription"
          description="Current billing for your Custom ERP package — not a predefined Starter / Business / Enterprise plan."
        />
        <PortalPanel
          title="Current subscription"
          description="Billing cycle, renewal, and payment status from License Engine."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Package", value: "Custom ERP Package" },
              { label: "Current billing", value: formatBillingCycleLabel(billingCycle) },
              { label: "Status", value: String(sub?.status || data.subscription?.status || "—") },
              ...(canRenew
                ? [{ label: "Renewal date", value: formatPortalDate(renewal) }]
                : []),
              ...(canRenew
                ? [
                    {
                      label: "Auto renewal",
                      value: sub?.auto_renewal ? "On" : "Off",
                    },
                  ]
                : []),
              { label: "Payment status", value: String(paymentStatus) },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                  {row.label}
                </p>
                <p className="mt-2 text-sm font-semibold capitalize">{row.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-xl">
              <Link href="/portal/custom-erp">Upgrade Custom ERP</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link href="/portal/custom-erp">Modify ERP</Link>
            </Button>
            {canRenew ? (
              <PortalCustomErpRenewButton subscriptionId={sub?.id} label="Renew license" />
            ) : null}
            <Button asChild size="sm" variant="ghost" className="rounded-xl">
              <Link href="/portal/billing">View billing</Link>
            </Button>
          </div>
          {!canRenew ? (
            <p className="mt-4 text-sm text-[var(--portal-muted)]">
              Lifetime packages do not renew. Upgrade modules, feature packs, or limits instead.
            </p>
          ) : null}
        </PortalPanel>
      </div>
    );
  }

  if (section === "modules") {
    const catalogModules = data.catalogModuleCodes?.length ? data.catalogModuleCodes : [];
    const enabled = new Set(modules.map((m) => m.toLowerCase()));
    const available = catalogModules.filter((m) => !enabled.has(m.toLowerCase()));

    return (
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow="Custom ERP"
          title="Modules"
          description="Purchased, enabled, and available modules on your Custom ERP package."
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <PortalPanel title="Purchased / enabled modules" description="Active on your license.">
            {modules.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {modules.map((m) => (
                  <li
                    key={m}
                    className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3.5 py-3 text-sm font-medium"
                  >
                    {titleCaseCode(m)}
                    <span className="ml-2 text-xs text-[var(--portal-primary)]">Enabled</span>
                  </li>
                ))}
              </ul>
            ) : (
              <PortalEmptyState
                title="No modules listed"
                description="Module entitlements will appear when License Engine returns your package composition."
              />
            )}
          </PortalPanel>
          <PortalPanel title="Available modules" description="Add via Custom ERP configuration quote.">
            {available.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {available.map((m) => (
                  <li
                    key={m}
                    className="rounded-xl border border-dashed border-[var(--portal-border)] px-3.5 py-3 text-sm"
                  >
                    {titleCaseCode(m)}
                    <span className="ml-2 text-xs text-[var(--portal-muted)]">Not installed</span>
                  </li>
                ))}
              </ul>
            ) : catalogModules.length === 0 ? (
              <p className="text-sm text-[var(--portal-muted)]">
                Module catalog is loading from License Engine.
              </p>
            ) : (
              <p className="text-sm text-[var(--portal-muted)]">
                All catalog modules on your account are enabled.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-xl">
                <Link href="/portal/custom-erp">Add module · preview cost</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <Link href="/portal/custom-erp">Send upgrade request</Link>
              </Button>
            </div>
          </PortalPanel>
        </div>
      </div>
    );
  }

  if (section === "feature-packs") {
    return (
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow="Custom ERP"
          title="Feature Packs"
          description="Purchased and available feature packs on your Custom ERP package."
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <PortalPanel title="Purchased / active packs" description="Currently entitled packs.">
            {packs.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {packs.map((p) => (
                  <li
                    key={p}
                    className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3.5 py-3 text-sm font-medium"
                  >
                    {titleCaseCode(p)}
                  </li>
                ))}
              </ul>
            ) : (
              <PortalEmptyState
                title="No feature packs listed"
                description="Packs appear when included on your Custom ERP license."
              />
            )}
          </PortalPanel>
          <PortalPanel title="Add / remove / preview" description="Pack changes via Custom ERP quote.">
            <div className="space-y-3 text-sm text-[var(--portal-muted)]">
              <p>
                Available packs and pricing are reviewed in Modify ERP Configuration, then confirmed
                with License Engine before the license updates.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="rounded-xl">
                  <Link href="/portal/custom-erp">Add pack · preview</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href="/portal/custom-erp">Remove · upgrade request</Link>
                </Button>
              </div>
            </div>
          </PortalPanel>
        </div>
      </div>
    );
  }

  if (section === "limits") {
    return (
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow="Custom ERP"
          title="Limits"
          description="Tenant limits for your Custom ERP package. Increase limits through configuration quotes."
        />
        <PortalPanel title="Current vs maximum" description="Usage and entitlement caps from License Engine.">
          <div className="grid gap-3 sm:grid-cols-2">
            {usage.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                  {row.label}
                </p>
                {row.max != null && row.max > 0 && row.used != null ? (
                  <div className="mt-3">
                    <PortalUsageMeter
                      label={`${row.label} usage`}
                      used={Number(row.used)}
                      limit={Number(row.max)}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xl font-semibold tracking-tight">
                    {row.used != null ? `${row.used}` : "—"}
                    {row.max != null ? ` / ${row.max}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-xl">
              <Link href="/portal/custom-erp">Increase limit · preview pricing</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link href="/portal/users">View users</Link>
            </Button>
          </div>
        </PortalPanel>
      </div>
    );
  }

  if (section === "support") {
    return (
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow="Custom ERP"
          title="Support"
          description="Tickets, downloads, and documentation for your Custom ERP workspace."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              href: "/contact",
              label: "Open a ticket",
              hint: "Contact WaamTech support",
              icon: LifeBuoy,
              external: false,
            },
            {
              href: "/portal/licenses",
              label: "Downloads",
              hint: "License keys and entitlement detail",
              icon: FileText,
              external: false,
            },
            {
              href: process.env.NEXT_PUBLIC_DOCS_URL || "https://doc.waamto.com",
              label: "Documentation",
              hint: "Product help center",
              icon: ExternalLink,
              external: true,
            },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="portal-focus-ring rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5 transition hover:border-[var(--portal-primary)]/40"
            >
              <item.icon className="h-5 w-5 text-[var(--portal-primary)]" />
              <p className="mt-3 text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs text-[var(--portal-muted)]">{item.hint}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return <PortalCustomErpUpgradeWizard data={data} />;
}

// ─── Custom ERP Upgrade Wizard ────────────────────────────────────────────────

type UpgradeCatalogModule = {
  code: string;
  name: string;
  description?: string | null;
  monthly_price?: number | null;
  yearly_price?: number | null;
  lifetime_price?: number | null;
};

type UpgradeCatalogPack = NonNullable<PortalDashboard["catalogFeaturePacks"]>[number];

function normCode(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function cycleUnitPrice(
  item: {
    monthly_price?: number | null;
    yearly_price?: number | null;
    lifetime_price?: number | null;
    cycle_price?: number | null;
  },
  cycle: string | null | undefined
): number {
  if (typeof item.cycle_price === "number" && Number.isFinite(item.cycle_price)) {
    return item.cycle_price;
  }
  const c = String(cycle || "monthly").toLowerCase();
  if (/lifetime|one.?time|once/.test(c)) return Number(item.lifetime_price || 0);
  if (/year/.test(c)) return Number(item.yearly_price || 0);
  return Number(item.monthly_price || 0);
}

function resolveOwnedCodes(input: {
  codes?: string[] | null;
  labels?: string[] | null;
  snapshotCodes?: string[] | null;
  catalog: Array<{ code: string; name: string }>;
}): string[] {
  const fromCodes = (input.codes || []).map(normCode).filter(Boolean);
  const fromSnap = (input.snapshotCodes || []).map(normCode).filter(Boolean);
  if (fromCodes.length) return Array.from(new Set(fromCodes));
  if (fromSnap.length) return Array.from(new Set(fromSnap));

  const byName = new Map<string, string>();
  const byCode = new Map<string, string>();
  for (const row of input.catalog) {
    const code = normCode(row.code);
    if (!code) continue;
    byCode.set(code, code);
    byName.set(normCode(row.name), code);
    byName.set(code.replace(/_/g, " "), code);
  }
  const resolved: string[] = [];
  for (const label of input.labels || []) {
    const key = normCode(label);
    const code =
      byCode.get(key) ||
      byName.get(key) ||
      byName.get(key.replace(/_/g, " ")) ||
      key.replace(/\s+/g, "_");
    if (code) resolved.push(code);
  }
  return Array.from(new Set(resolved));
}

function PortalCustomErpUpgradeWizard({ data }: { data: PortalDashboard }) {
  const router = useRouter();
  const { formatPrice } = useLocale();
  const primary = primaryPortalLicense(data.licenses);
  const sub = activeSubscription(data);
  const billingCycle = resolvePrimaryBillingCycle(primary, data.subscriptions);
  const snap = data.commercialSnapshot;

  const serverModules = (data.catalogModules || []) as UpgradeCatalogModule[];
  const catalogPacks = (data.catalogFeaturePacks || []) as UpgradeCatalogPack[];

  const ownedModuleCodes = new Set(
    resolveOwnedCodes({
      // Prefer commercial snapshot selected_modules (Custom ERP SSOT) over polluted license dumps.
      codes:
        (Array.isArray(snap?.selected_modules) && snap.selected_modules.length
          ? snap.selected_modules
          : null) ||
        primary?.module_codes ||
        null,
      labels: primary?.modules ?? data.modules,
      snapshotCodes:
        snap?.selected_modules ||
        snap?.effective_modules ||
        snap?.modules ||
        null,
      catalog: serverModules.map((m) => ({ code: m.code, name: m.name })),
    })
  );
  const ownedPackCodes = new Set(
    resolveOwnedCodes({
      codes:
        (Array.isArray(snap?.feature_packs) && snap.feature_packs.length
          ? snap.feature_packs
          : null) ||
        primary?.feature_pack_codes ||
        null,
      labels: primary?.feature_packs ?? data.featurePacks,
      snapshotCodes: snap?.feature_packs || null,
      catalog: catalogPacks.map((p) => ({ code: p.code, name: p.name })),
    })
  );

  const currentLimits = resolvePurchasedLimits(
    snap,
    (primary?.tenant_limits ?? {}) as Record<string, number | null>
  );

  const [catalogModules, setCatalogModules] =
    useState<UpgradeCatalogModule[]>(serverModules);
  const [catalogLoading, setCatalogLoading] = useState(serverModules.length === 0);

  const minUsers = currentLimits.users ?? 1;
  const minBranches = currentLimits.branches ?? 1;
  const minWarehouses = currentLimits.warehouses ?? 1;

  const [selectedModules, setSelectedModules] = useState<Set<string>>(
    () => new Set(ownedModuleCodes)
  );
  const [selectedPacks, setSelectedPacks] = useState<Set<string>>(
    () => new Set(ownedPackCodes)
  );
  const [userLimit, setUserLimit] = useState<number>(Math.max(minUsers, 1));
  const [branchLimit, setBranchLimit] = useState<number>(Math.max(minBranches, 1));
  const [warehouseLimit, setWarehouseLimit] = useState<number>(
    Math.max(minWarehouses, 1)
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (serverModules.length > 0) {
      setCatalogModules(serverModules);
      setCatalogLoading(false);
    }
    const productSlug = primary?.product_slug || "waamto-erp";
    setCatalogLoading(serverModules.length === 0);
    fetchPublicModules(productSlug)
      .then((res) => {
        if (!res.ok || !Array.isArray(res.data)) return;
        const rows = (res.data as UpgradeCatalogModule[])
          .filter((m) => m.code && m.name)
          .map((m) => ({
            code: String(m.code),
            name: String(m.name),
            description: m.description ?? null,
            monthly_price:
              typeof m.monthly_price === "number" ? m.monthly_price : null,
            yearly_price:
              typeof m.yearly_price === "number" ? m.yearly_price : null,
            lifetime_price:
              typeof m.lifetime_price === "number" ? m.lifetime_price : null,
          }));
        if (rows.length) setCatalogModules(rows);
      })
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, [primary?.product_slug, serverModules.length]);

  const moduleByCode = new Map(
    catalogModules.map((m) => [normCode(m.code), m] as const)
  );
  const packByCode = new Map(
    catalogPacks.map((p) => [normCode(p.code), p] as const)
  );

  const newlySelected = [...selectedModules].filter((c) => !ownedModuleCodes.has(c));
  const newlySelectedPacks = [...selectedPacks].filter((c) => !ownedPackCodes.has(c));
  const removedModules = [...ownedModuleCodes].filter((c) => !selectedModules.has(c));
  const removedPacks = [...ownedPackCodes].filter((c) => !selectedPacks.has(c));

  const limitIncreases =
    (currentLimits.users != null && userLimit > currentLimits.users) ||
    (currentLimits.branches != null && branchLimit > currentLimits.branches) ||
    (currentLimits.warehouses != null && warehouseLimit > currentLimits.warehouses);

  const hasPaidChanges =
    newlySelected.length > 0 || newlySelectedPacks.length > 0 || limitIncreases;
  const hasRemovals = removedModules.length > 0 || removedPacks.length > 0;
  const hasChanges = hasPaidChanges || hasRemovals;
  // Paid adds go to checkout; removal-only heals polluted licenses without payment.
  const canCheckout = selectedModules.size > 0 && hasChanges;

  const estimatedAddTotal = [
    ...newlySelected.map((code) => {
      const mod = moduleByCode.get(code);
      return mod ? cycleUnitPrice(mod, billingCycle) : 0;
    }),
    ...newlySelectedPacks.map((code) => {
      const pack = packByCode.get(code);
      return pack ? cycleUnitPrice(pack, billingCycle) : 0;
    }),
  ].reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);

  function toggleModule(code: string) {
    const lower = normCode(code);
    const removing = selectedModules.has(lower);
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(lower)) next.delete(lower);
      else next.add(lower);
      return next;
    });
    if (removing) {
      setSelectedPacks((packs) => {
        const nextPacks = new Set(packs);
        for (const packCode of nextPacks) {
          const pack = packByCode.get(packCode);
          const required = (pack?.required_module_codes || []).map(normCode);
          if (required.includes(lower)) nextPacks.delete(packCode);
        }
        return nextPacks;
      });
    }
  }

  function togglePack(code: string) {
    const lower = normCode(code);
    const pack = packByCode.get(lower);
    const adding = !selectedPacks.has(lower);
    setSelectedPacks((prev) => {
      const next = new Set(prev);
      if (next.has(lower)) next.delete(lower);
      else next.add(lower);
      return next;
    });
    if (adding) {
      const required = (pack?.required_module_codes || []).map(normCode).filter(Boolean);
      if (required.length) {
        setSelectedModules((mods) => {
          const nextMods = new Set(mods);
          for (const req of required) nextMods.add(req);
          return nextMods;
        });
      }
    }
  }

  async function handleUpgrade() {
    if (!sub?.id) {
      setSubmitError("No active subscription found.");
      return;
    }
    if (!canCheckout) {
      setSubmitError(
        "Select at least one module change — add, remove, or increase a limit — to continue."
      );
      return;
    }
    if (selectedModules.size === 0) {
      setSubmitError("Keep at least one module selected for your Custom ERP package.");
      return;
    }

    // Submit canonical catalog codes (not display labels).
    const moduleCodes = [...selectedModules]
      .map((c) => moduleByCode.get(c)?.code || c)
      .filter(Boolean);
    const packCodes = [...selectedPacks]
      .map((c) => packByCode.get(c)?.code || c)
      .filter(Boolean);

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/portal/billing/custom-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_id: sub.id,
          selected_modules: moduleCodes,
          selected_feature_packs: packCodes,
          user_limit: userLimit,
          branch_limit: branchLimit,
          warehouse_limit: warehouseLimit,
          billing_cycle: billingCycle || undefined,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          session_token?: string;
          applied_without_payment?: boolean;
        };
        message?: string;
      };
      if (!res.ok || !json.success) {
        setSubmitError(
          json.message || "Unable to update Custom ERP package. Please try again."
        );
        return;
      }
      if (json.data?.applied_without_payment) {
        router.push("/portal/modules?updated=1");
        return;
      }
      if (!json.data?.session_token) {
        setSubmitError(
          json.message || "Unable to create upgrade checkout. Please try again."
        );
        return;
      }
      router.push(
        `/portal/checkout?session=${encodeURIComponent(json.data.session_token)}&mode=upgrade`
      );
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderModuleCard(m: UpgradeCatalogModule) {
    const code = normCode(m.code);
    const isOwned = ownedModuleCodes.has(code);
    const isSelected = selectedModules.has(code);
    const price = cycleUnitPrice(m, billingCycle);
    const showPrice = !isOwned || !isSelected;
    return (
      <button
        key={m.code}
        type="button"
        onClick={() => toggleModule(m.code)}
        className={cn(
          "portal-focus-ring flex items-start gap-3 rounded-xl border p-3 text-left transition",
          isSelected
            ? "border-[var(--portal-primary)] bg-[var(--portal-primary)]/5"
            : "border-[var(--portal-border)] bg-[var(--portal-soft)] hover:border-[var(--portal-primary)]/40"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            isSelected
              ? "border-[var(--portal-primary)] bg-[var(--portal-primary)] text-white"
              : "border-[var(--portal-border)]"
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{m.name}</span>
            {isOwned && isSelected ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Already purchased
              </span>
            ) : null}
            {isOwned && !isSelected ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Will remove
              </span>
            ) : null}
          </span>
          {m.description ? (
            <span className="mt-0.5 block text-xs text-[var(--portal-muted)] line-clamp-1">
              {m.description}
            </span>
          ) : null}
          {showPrice ? (
            <span className="mt-1 block text-xs font-semibold text-[var(--portal-ink)]">
              {price > 0 ? formatPrice(price) : "Included / quoted at checkout"}
            </span>
          ) : (
            <span className="mt-1 block text-xs text-[var(--portal-muted)]">Included</span>
          )}
        </span>
      </button>
    );
  }

  function renderPackCard(pack: UpgradeCatalogPack) {
    const code = normCode(pack.code);
    const isOwned = ownedPackCodes.has(code);
    const isSelected = selectedPacks.has(code);
    const price = cycleUnitPrice(pack, billingCycle);
    const showPrice = !isOwned || !isSelected;
    const required = (pack.required_module_codes || []).map(normCode).filter(Boolean);
    const missingRequired = required.filter((r) => !selectedModules.has(r));
    return (
      <button
        key={pack.code}
        type="button"
        onClick={() => togglePack(pack.code)}
        className={cn(
          "portal-focus-ring flex items-start gap-3 rounded-xl border p-3 text-left transition",
          isSelected
            ? "border-[var(--portal-primary)] bg-[var(--portal-primary)]/5"
            : "border-[var(--portal-border)] bg-[var(--portal-soft)] hover:border-[var(--portal-primary)]/40"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            isSelected
              ? "border-[var(--portal-primary)] bg-[var(--portal-primary)] text-white"
              : "border-[var(--portal-border)]"
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{pack.name}</span>
            {isOwned && isSelected ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Already purchased
              </span>
            ) : null}
            {isOwned && !isSelected ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Will remove
              </span>
            ) : null}
          </span>
          {pack.description ? (
            <span className="mt-0.5 block text-xs text-[var(--portal-muted)] line-clamp-2">
              {pack.description}
            </span>
          ) : null}
          {required.length > 0 ? (
            <span className="mt-1 block text-[11px] text-[var(--portal-muted)]">
              Requires modules:{" "}
              {required
                .map((r) => moduleByCode.get(r)?.name || titleCaseCode(r))
                .join(", ")}
              {missingRequired.length > 0 ? (
                <span className="text-amber-700 dark:text-amber-300">
                  {" "}
                  (will auto-add)
                </span>
              ) : null}
            </span>
          ) : null}
          {showPrice ? (
            <span className="mt-1 block text-xs font-semibold text-[var(--portal-ink)]">
              {price > 0 ? formatPrice(price) : "Quoted at checkout"}
            </span>
          ) : (
            <span className="mt-1 block text-xs text-[var(--portal-muted)]">Included</span>
          )}
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Custom ERP"
        title="Upgrade Configuration"
        description="Choose modules, then feature packs. Prices and required modules are shown before License Engine checkout."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <PortalPanel
            title="Modules"
            description={
              catalogLoading
                ? "Loading catalog…"
                : `${catalogModules.length} catalog module${catalogModules.length !== 1 ? "s" : ""}. Uncheck an already-purchased item to schedule removal with your next paid upgrade.`
            }
          >
            {catalogLoading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--portal-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading modules…
              </div>
            ) : catalogModules.length === 0 ? (
              <p className="text-sm text-[var(--portal-muted)]">
                Module catalog is unavailable right now. Refresh the page or try again shortly.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {catalogModules.map(renderModuleCard)}
              </div>
            )}
          </PortalPanel>

          <PortalPanel
            title="Feature packs"
            description={`${catalogPacks.length} pack${catalogPacks.length !== 1 ? "s" : ""} in catalog. Selecting a pack auto-adds its required modules.`}
          >
            {catalogPacks.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {catalogPacks.map(renderPackCard)}
              </div>
            ) : (
              <p className="text-sm text-[var(--portal-muted)]">
                No feature packs are available in the catalog for this product.
              </p>
            )}
          </PortalPanel>

          <PortalPanel
            title="Adjust limits"
            description="Increase user, branch, or warehouse limits for your tenant."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Users",
                  value: userLimit,
                  min: minUsers,
                  set: setUserLimit,
                  current: currentLimits.users,
                },
                {
                  label: "Branches",
                  value: branchLimit,
                  min: minBranches,
                  set: setBranchLimit,
                  current: currentLimits.branches,
                },
                {
                  label: "Warehouses",
                  value: warehouseLimit,
                  min: minWarehouses,
                  set: setWarehouseLimit,
                  current: currentLimits.warehouses,
                },
              ].map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    min={f.min}
                    value={f.value}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= (f.min as number)) f.set(v);
                    }}
                    className="w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3 py-2 text-sm focus:border-[var(--portal-primary)] focus:outline-none"
                  />
                  <p className="text-[11px] text-[var(--portal-muted)]">
                    Purchased: {f.current != null ? f.current : "—"}
                  </p>
                </div>
              ))}
            </div>
          </PortalPanel>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <PortalPanel
            title="Order summary"
            description="Review adds, removals, and estimated new charges before checkout."
          >
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                  Billing cycle
                </p>
                <p className="mt-1 font-medium">
                  {formatBillingCycleLabel(billingCycle)}
                </p>
              </div>

              {newlySelected.length > 0 ? (
                <div>
                  <p className="font-medium">New modules</p>
                  <ul className="mt-1 space-y-1 text-[var(--portal-muted)]">
                    {newlySelected.map((code) => {
                      const mod = moduleByCode.get(code);
                      const price = mod ? cycleUnitPrice(mod, billingCycle) : 0;
                      return (
                        <li key={code} className="flex justify-between gap-2">
                          <span>{mod?.name || titleCaseCode(code)}</span>
                          <span className="shrink-0 font-medium text-[var(--portal-ink)]">
                            {price > 0 ? formatPrice(price) : "—"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {newlySelectedPacks.length > 0 ? (
                <div>
                  <p className="font-medium">New feature packs</p>
                  <ul className="mt-1 space-y-1 text-[var(--portal-muted)]">
                    {newlySelectedPacks.map((code) => {
                      const pack = packByCode.get(code);
                      const price = pack ? cycleUnitPrice(pack, billingCycle) : 0;
                      return (
                        <li key={code} className="flex justify-between gap-2">
                          <span>{pack?.name || titleCaseCode(code)}</span>
                          <span className="shrink-0 font-medium text-[var(--portal-ink)]">
                            {price > 0 ? formatPrice(price) : "—"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {hasRemovals ? (
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">
                    Scheduled removals
                  </p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    Applied with your next paid upgrade (no separate refund on this page).
                  </p>
                  <ul className="mt-1 space-y-1 text-[var(--portal-muted)]">
                    {removedModules.map((code) => (
                      <li key={`rm-${code}`}>
                        Module: {moduleByCode.get(code)?.name || titleCaseCode(code)}
                      </li>
                    ))}
                    {removedPacks.map((code) => (
                      <li key={`rp-${code}`}>
                        Pack: {packByCode.get(code)?.name || titleCaseCode(code)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!hasChanges ? (
                <p className="text-[var(--portal-muted)]">
                  Select modules or feature packs to build your upgrade.
                </p>
              ) : null}

              <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--portal-muted)]">Estimated new items</span>
                  <span className="font-semibold">
                    {estimatedAddTotal > 0
                      ? formatPrice(estimatedAddTotal)
                      : hasPaidChanges
                        ? "Quoted at checkout"
                        : formatPrice(0)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--portal-muted)]">
                  {hasPaidChanges
                    ? "Final amount (including seat overages) is confirmed on checkout from the License Engine upgrade quote."
                    : "Removals apply immediately at no charge. ERP will sync to only the modules you keep selected."}
                </p>
              </div>

              {submitError ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  {submitError}
                </p>
              ) : null}

              <Button
                size="sm"
                className="w-full rounded-xl"
                disabled={!canCheckout || submitting || !sub?.id}
                onClick={handleUpgrade}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    {hasPaidChanges ? "Creating checkout…" : "Applying changes…"}
                  </>
                ) : hasPaidChanges ? (
                  <>
                    Upgrade &amp; Checkout
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Apply module changes
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
                <Link href="/portal/billing">Review billing</Link>
              </Button>

              {!sub?.id ? (
                <p className="text-xs text-[var(--portal-muted)]">
                  No active subscription found. Contact support if your license is active.
                </p>
              ) : null}
            </div>
          </PortalPanel>
        </aside>
      </div>
    </div>
  );
}
