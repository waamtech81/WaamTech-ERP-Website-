"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  KeyRound,
  Package,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/shared/counter";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { formatPortalDate, formatPortalDateTime } from "@/components/portal/use-portal-data";
import {
  PortalEmptyState,
  PortalErrorState,
  PortalFadeIn,
  PortalPageHeader,
  PortalPanel,
  PortalSkeleton,
  PortalStatCard,
  PortalStatusBadge,
} from "@/components/portal/portal-ui";
import { PortalLicenseEntitlements } from "@/components/portal/portal-license-detail";
import { PortalDashboardPayBanner } from "@/components/portal/portal-dashboard-pay-banner";
import { PortalEmailDeliveryNotice } from "@/components/portal/portal-email-delivery-notice";
import {
  primaryPortalLicense,
  resolvePortalJourneyFromDashboard,
} from "@/lib/portal/package-type";
import {
  resolvePortalPlanTier,
  upgradeActionForPortal,
} from "@/lib/portal/commercial-rules";
import { subscriptionActionsLocked } from "@/components/portal/portal-subscription-cancel";
import { cn } from "@/lib/utils";
import { authConfig } from "@/lib/auth/config";

type DashboardSummaryItem = {
  label: string;
  value: ReactNode;
  hint?: string | null;
  icon: typeof KeyRound;
  tone?: "default" | "success" | "warning";
  href: string;
  highlight?: boolean;
};

function DashboardSummarySection({
  title,
  items,
  columns = 4,
  compact = false,
}: {
  title: string;
  items: DashboardSummaryItem[];
  columns?: 1 | 2 | 3 | 4;
  compact?: boolean;
}) {
  if (!items.length) return null;

  const columnClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-2"
        : columns === 3
          ? "grid-cols-2 md:grid-cols-3"
          : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
        {title}
      </h2>
      <div className={cn("grid auto-rows-fr gap-3", columnClass)}>
        {items.map((item) => (
          <PortalStatCard
            key={item.label}
            label={item.label}
            value={
              typeof item.value === "number" ? <Counter value={item.value} /> : item.value
            }
            hint={item.hint}
            icon={item.icon}
            tone={item.tone}
            href={item.href}
            highlight={item.highlight}
            compact={compact}
            className={compact ? "min-h-[4.75rem]" : "min-h-[8.5rem]"}
          />
        ))}
      </div>
    </section>
  );
}

export function PortalDashboardView() {
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={3} />;
  if (error || !data) {
    return <PortalErrorState message={error || "Something went wrong."} onRetry={reload} />;
  }

  const {
    overview,
    subscription,
    licenses,
    counts,
    billing,
    businesses,
    invoices,
    notifications,
    unreadNotifications,
    renewals,
    workspaceUsers,
  } = data;

  const expiringLicenses = licenses.filter(
    (l) =>
      typeof l.days_remaining === "number" &&
      l.days_remaining >= 0 &&
      l.days_remaining <= 30
  ).length;

  const upcomingRenewals = (renewals || []).length
    ? renewals.length
    : licenses.filter(
        (l) =>
          typeof l.days_remaining === "number" &&
          l.days_remaining >= 0 &&
          l.days_remaining <= 60
      ).length;

  type SummaryItem = DashboardSummaryItem;

  const filterSummary = (items: SummaryItem[]) =>
    items.filter(
      (item) =>
        item.value !== null &&
        item.value !== undefined &&
        item.value !== "" &&
        item.value !== "—"
    );

  const planName = subscription?.currentPlan || null;
  const subStatus = String(subscription?.status || "").toLowerCase();
  const isActivePlan = ["active", "trial", "trialing", "grace"].includes(subStatus);
  const outstanding = String(billing?.outstandingBalance || "").trim();
  const hasOutstanding =
    outstanding &&
    outstanding !== "—" &&
    outstanding !== "0" &&
    outstanding !== "0.00" &&
    !/^0+(\.0+)?\s*[a-z]*$/i.test(outstanding);

  const currentPlanValue = planName ? (
    <span className="block leading-tight">
      {isActivePlan ? (
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600">
          Active
        </span>
      ) : null}
      <span>{planName}</span>
    </span>
  ) : null;

  /** Attention + plan health only — detail lives on Licenses / Billing / Invoices. */
  const subscriptionSummary = filterSummary([
    {
      label: "Current plan",
      value: currentPlanValue,
      hint: isActivePlan ? null : subscription?.status,
      icon: Package,
      tone: "success" as const,
      highlight: true,
      href: "/portal/subscriptions",
    },
    {
      label: "Next renewal",
      value:
        formatPortalDate(billing?.nextInvoice || subscription?.renewalDate) || null,
      icon: Calendar,
      tone: "warning" as const,
      href: "/portal/billing",
    },
    {
      label: "Trial remaining",
      value:
        subscription?.trialRemainingDays != null
          ? `${subscription.trialRemainingDays} days`
          : null,
      hint: subscription?.trialStatus,
      icon: Calendar,
      tone: "warning" as const,
      href: "/portal/subscriptions",
    },
    {
      label: "Needs attention",
      value: upcomingRenewals || expiringLicenses || null,
      hint:
        expiringLicenses > 0
          ? `${expiringLicenses} license(s) expiring soon`
          : upcomingRenewals
            ? "Upcoming renewals"
            : null,
      icon: Calendar,
      tone: "warning" as const,
      href: "/portal/plans?intent=renew",
    },
    {
      label: "Outstanding balance",
      value: hasOutstanding ? outstanding : null,
      icon: CreditCard,
      tone: "warning" as const,
      href: "/portal/billing",
    },
  ]);

  const licenseSummary = filterSummary([
    {
      label: "Active licenses",
      value: licenses.filter((l) =>
        ["active", "trial", "grace"].includes(
          String(l.effective_status || l.status).toLowerCase()
        )
      ).length,
      icon: KeyRound,
      tone: "success" as const,
      href: "/portal/licenses",
    },
    {
      label: "Expiring soon",
      value: expiringLicenses || null,
      icon: Calendar,
      tone: "warning" as const,
      href: "/portal/licenses",
    },
  ]);

  const workspaceSummary = filterSummary([
    {
      label: "Businesses",
      value: businesses?.length || counts.registeredBusinesses,
      icon: Building2,
      href: "/portal/business-profile",
    },
    {
      label: "Users",
      value: workspaceUsers?.length || counts.registeredUsers,
      icon: Users,
      href: "/portal/users",
    },
    {
      label: "Unread alerts",
      value: unreadNotifications || null,
      icon: Bell,
      href: "/portal/notifications",
    },
  ]);

  const primary = licenses[0];
  const firstName = String(overview.customerName || "there").split(" ")[0] || "there";
  const renewSubId =
    data.subscriptions?.find((s) =>
      ["active", "trial", "trialing", "grace", "suspended", "expired"].includes(
        String(s.status || "").toLowerCase()
      )
    )?.id || data.subscriptions?.[0]?.id;
  const activeSubscription =
    data.subscriptions?.find((s) => s.id === renewSubId) || data.subscriptions?.[0] || null;
  const subscriptionActionsBlocked = subscriptionActionsLocked(activeSubscription);
  const dashboardTier = resolvePortalPlanTier({
    plan_name: activeSubscription?.plan_name || data.subscription?.currentPlan,
    plan_id: activeSubscription?.plan_id,
    package_type: primaryPortalLicense(data.licenses)?.package_type,
    billing_cycle: activeSubscription?.billing_cycle,
    currentPlan: data.subscription?.currentPlan,
  });
  const upgradeAction = upgradeActionForPortal({
    journey: resolvePortalJourneyFromDashboard(data),
    currentTier: dashboardTier,
    registry: data.commercialRegistry,
    subscriptionId: renewSubId,
  });

  const openErpHref = `${authConfig.appUrl.replace(/\/+$/, "")}/login?email=${encodeURIComponent(
    String(data.identity?.email || "")
  )}`;

  const accountActionItems =
    data.commercialJourney === "custom"
      ? [
          {
            href: openErpHref,
            label: "Open WAAMTO ERP",
            hint: "Launch your workspace",
            external: true,
          },
          {
            href: "/portal/modules",
            label: "Manage modules",
            hint: "Fully enabled · Custom ERP",
          },
          {
            href: "/portal/custom-erp",
            label: "Modify ERP configuration",
            hint: "Quote preview · license update",
          },
          {
            href: "/portal/billing",
            label: "Billing & payments",
            hint: "Invoices · payment history",
          },
        ]
      : [
          {
            href: openErpHref,
            label: "Open WAAMTO ERP",
            hint: "Launch your workspace",
            external: true,
          },
          ...(upgradeAction.href
            ? [
                {
                  href: upgradeAction.href,
                  label: upgradeAction.label,
                  hint: subscriptionActionsBlocked
                    ? "Keep subscription to unlock upgrades"
                    : upgradeAction.hint,
                  disabled:
                    subscriptionActionsBlocked && upgradeAction.kind === "self_serve_upgrade",
                },
              ]
            : []),
          {
            href: "/portal/plans?intent=new_place",
            label: "Create New Business",
            hint: "New business on same account",
          },
          {
            href: "/portal/billing",
            label: "Billing & payments",
            hint: "Invoices · payment history",
          },
        ];

  const hasSummary =
    subscriptionSummary.length + licenseSummary.length + workspaceSummary.length > 0;

  return (
    <div className="space-y-8">
      <PortalEmailDeliveryNotice />
      <PortalDashboardPayBanner data={data} />
      <PortalPageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description={`${overview.company} · Plan status, what needs attention, and your next steps.`}
        actions={
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="order-2 min-w-0 flex-1 space-y-6 lg:order-1">
          {subscriptionSummary.length ? (
            <DashboardSummarySection
              title="Subscription & billing"
              items={subscriptionSummary}
              columns={4}
            />
          ) : hasSummary ? null : (
            <PortalEmptyState
              title="Overview will appear here"
              description="Summary cards populate from your licenses, subscription, and optional workspace stats."
              actionLabel="View licenses"
              actionHref="/portal/licenses"
            />
          )}

          <PortalFadeIn>
            <PortalPanel
              title="License"
              description="Your current plan, status, modules, and renewal information."
              action={
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href="/portal/licenses">View licenses</Link>
                </Button>
              }
            >
              {primary ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                        Current plan
                      </p>
                      <p className="mt-1 text-base font-semibold tracking-tight sm:text-lg">
                        {primary.product_name || "WAAMTO ERP"} ·{" "}
                        {primary.plan_name ||
                          (String(primary.package_type || "").toLowerCase() === "custom"
                            ? "Custom ERP"
                            : "Plan")}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <PortalStatusBadge status={primary.effective_status || primary.status} />
                    </div>
                  </div>
                  <PortalLicenseEntitlements
                    license={primary}
                    billingCycleFallback={data.subscriptions?.[0]?.billing_cycle}
                    customerFacing
                    showEntitlementLists={false}
                    snapshot={data.commercialSnapshot}
                    registry={data.commercialRegistry}
                    journey={
                      String(primary.package_type || "").toLowerCase() === "custom"
                        ? "custom"
                        : "predefined"
                    }
                    planTier={undefined}
                    renewalDate={
                      activeSubscription?.renewal_date ||
                      data.subscription?.renewalDate ||
                      null
                    }
                    billingStatus={
                      activeSubscription?.status || data.subscription?.status || null
                    }
                    primaryMeta={[
                      {
                        label: "License status",
                        value: String(primary.effective_status || primary.status || "—"),
                      },
                      {
                        label: "Activation",
                        value: formatPortalDate(primary.activation_date) || "—",
                      },
                      {
                        label: "Expiry date",
                        value: formatPortalDate(primary.expiry_date) || "—",
                      },
                      {
                        label: "Days left",
                        value:
                          typeof primary.days_remaining === "number"
                            ? String(primary.days_remaining)
                            : "—",
                      },
                    ].filter((r) => r.value && r.value !== "—")}
                  />
                  <p className="text-xs text-[var(--portal-muted)]">
                    Modules and Feature Packs are listed under{" "}
                    <Link href="/portal/modules" className="font-medium text-[var(--portal-primary)] underline-offset-2 hover:underline">
                      Modules
                    </Link>
                    {" · "}
                    <Link href="/portal/feature-packs" className="font-medium text-[var(--portal-primary)] underline-offset-2 hover:underline">
                      Feature Packs
                    </Link>
                    .
                  </p>
                  <div className="flex flex-wrap items-center gap-2 border-t border-[var(--portal-border)] pt-4">
                    <Button asChild size="sm" className="rounded-xl">
                      <Link
                        href={
                          data.commercialJourney === "custom"
                            ? "/portal/billing"
                            : renewSubId
                              ? `/portal/plans?intent=renew&subscription_id=${encodeURIComponent(renewSubId)}`
                              : "/portal/plans?intent=renew"
                        }
                      >
                        Renew
                      </Link>
                    </Button>
                    {data.commercialJourney === "custom" ? (
                      <>
                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                          <Link href="/portal/modules">Manage modules</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                          <Link href="/portal/custom-erp">Modify configuration</Link>
                        </Button>
                      </>
                    ) : upgradeAction.kind === "contact_sales" && upgradeAction.href ? (
                      <>
                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                          <Link href={upgradeAction.href}>{upgradeAction.label}</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                          <Link href="/portal/plans?intent=new_place">Create New Business</Link>
                        </Button>
                      </>
                    ) : upgradeAction.kind === "self_serve_upgrade" && upgradeAction.href ? (
                      <>
                        <Button
                          asChild={!subscriptionActionsBlocked}
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          disabled={subscriptionActionsBlocked}
                          title={
                            subscriptionActionsBlocked
                              ? "Keep subscription to upgrade again."
                              : upgradeAction.hint
                          }
                        >
                          {subscriptionActionsBlocked ? (
                            <span>Upgrade</span>
                          ) : (
                            <Link href={upgradeAction.href}>{upgradeAction.label}</Link>
                          )}
                        </Button>
                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                          <Link href="/portal/plans?intent=new_place">Create New Business</Link>
                        </Button>
                      </>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="rounded-xl">
                        <Link href="/portal/plans?intent=new_place">Create New Business</Link>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost" className="rounded-xl">
                      <Link href="/portal/billing">Payments</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <PortalEmptyState
                  title="No licenses yet"
                  description="Licenses will appear here once your account is activated."
                  actionLabel="Open subscriptions"
                  actionHref="/portal/subscriptions"
                  icon={KeyRound}
                />
              )}
            </PortalPanel>
          </PortalFadeIn>

          <div className="grid gap-6 md:grid-cols-2">
            <PortalPanel
              title="Needs your attention"
              description="Unread alerts that may need action."
              action={
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href="/portal/notifications">View all</Link>
                </Button>
              }
            >
              {(notifications || []).filter((n) => !n.read).length ? (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {(notifications || [])
                    .filter((n) => !n.read)
                    .slice(0, 5)
                    .map((n) => (
                      <div
                        key={n.id}
                        className="rounded-xl border border-[var(--portal-border)] px-4 py-3 text-sm"
                      >
                        <p className="min-w-0 font-medium">{n.title}</p>
                        {n.created_at ? (
                          <p className="mt-1 text-xs text-[var(--portal-muted)]">
                            {formatPortalDateTime(n.created_at)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                </div>
              ) : (
                <PortalEmptyState
                  title="You're all caught up"
                  description="No unread alerts right now."
                  icon={Bell}
                />
              )}
            </PortalPanel>

            <PortalPanel
              title="Recent invoices"
              description="Latest billing documents."
              action={
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href="/portal/invoices">View all</Link>
                </Button>
              }
            >
              {(invoices || []).length ? (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {(invoices || []).slice(0, 4).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-col gap-2 rounded-xl border border-[var(--portal-border)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{inv.number}</p>
                        <p className="text-xs text-[var(--portal-muted)]">
                          {formatPortalDate(inv.date) || "—"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <p className="tabular-nums font-medium">{inv.amount || "—"}</p>
                        <PortalStatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <PortalEmptyState
                  title="No invoices yet"
                  description="Invoices will appear here after billing activity."
                  icon={CreditCard}
                />
              )}
            </PortalPanel>
          </div>
        </div>

        <aside className="order-1 w-full shrink-0 space-y-4 lg:order-2 lg:sticky lg:top-4 lg:w-[min(100%,22rem)] lg:self-start xl:w-[26rem]">
          {(licenseSummary.length || workspaceSummary.length) ? (
            <div
              className={cn(
                "grid gap-3",
                licenseSummary.length && workspaceSummary.length ? "grid-cols-2" : "grid-cols-1"
              )}
            >
              {licenseSummary.length ? (
                <DashboardSummarySection
                  title="License health"
                  items={licenseSummary}
                  columns={1}
                  compact
                />
              ) : null}
              {workspaceSummary.length ? (
                <DashboardSummarySection
                  title="Workspace"
                  items={workspaceSummary}
                  columns={1}
                  compact
                />
              ) : null}
            </div>
          ) : null}

          <section
            aria-label="Next steps"
            className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-4 sm:p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
              Next steps
            </p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              {data.commercialJourney === "custom"
                ? "Open ERP, manage modules, or update billing."
                : "Open ERP, upgrade, or manage billing."}
            </p>
            <div className="mt-3 space-y-2">
              {accountActionItems.map((item) =>
                "disabled" in item && item.disabled ? (
                  <div
                    key={item.href + item.label}
                    className="block rounded-xl border border-dashed border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 opacity-70"
                    aria-disabled="true"
                  >
                    <p className="text-sm font-semibold text-[var(--portal-fg)]">{item.label}</p>
                    <p className="mt-1 text-xs text-[var(--portal-muted)]">{item.hint}</p>
                  </div>
                ) : "external" in item && item.external ? (
                  <a
                    key={item.href + item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-focus-ring flex items-start justify-between gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 transition hover:border-[var(--portal-primary)]/40 hover:bg-[var(--portal-primary-soft)]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--portal-fg)]">{item.label}</p>
                      <p className="mt-1 text-xs text-[var(--portal-muted)]">{item.hint}</p>
                    </div>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
                  </a>
                ) : (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className="portal-focus-ring block rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 transition hover:border-[var(--portal-primary)]/40 hover:bg-[var(--portal-primary-soft)]"
                  >
                    <p className="text-sm font-semibold text-[var(--portal-fg)]">{item.label}</p>
                    <p className="mt-1 text-xs text-[var(--portal-muted)]">{item.hint}</p>
                  </Link>
                )
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
