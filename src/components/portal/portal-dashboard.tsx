"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  KeyRound,
  Package,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/shared/counter";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { formatPortalDate } from "@/components/portal/use-portal-data";
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
import { TrustBadgeStrip } from "@/components/trust-badges";
import { PortalDashboardPayBanner } from "@/components/portal/portal-dashboard-pay-banner";
import { subscriptionActionsLocked } from "@/components/portal/portal-subscription-cancel";
import { cn } from "@/lib/utils";

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
    license,
    licenses,
    sessions,
    counts,
    modules,
    featurePacks,
    quickActions,
    erp,
    billing,
    businesses,
    invoices,
    notifications,
    unreadNotifications,
    renewals,
    payments,
    workspaceUsers,
  } = data;

  const erpObj = (erp || {}) as Record<string, unknown>;
  const branches =
    typeof erpObj.branches === "number"
      ? erpObj.branches
      : typeof erpObj.branch_count === "number"
        ? erpObj.branch_count
        : null;

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

  const paidTotal = (payments || [])
    .filter((p) => String(p.status).toLowerCase() === "completed" || String(p.status).toLowerCase() === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

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
      label: "Upcoming renewals",
      value: upcomingRenewals || null,
      icon: Calendar,
      tone: "warning" as const,
      href: "/portal/plans?intent=renew",
    },
    {
      label: "Payment summary",
      value: paidTotal > 0 ? paidTotal.toFixed(2) : billing?.outstandingBalance || null,
      hint: paidTotal > 0 ? "Total paid (recent)" : "Outstanding",
      icon: CreditCard,
      href: "/portal/billing",
    },
    {
      label: "Recent invoices",
      value: invoices?.length || null,
      icon: CreditCard,
      href: "/portal/invoices",
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
      label: "Expiring licenses",
      value: expiringLicenses || null,
      icon: Calendar,
      tone: "warning" as const,
      href: "/portal/licenses",
    },
    {
      label: "Modules",
      value: modules?.length || licenses[0]?.modules?.length || null,
      icon: Package,
      href: "/portal/modules",
    },
    {
      label: "Feature packs",
      value: featurePacks?.length || licenses[0]?.feature_packs?.length || null,
      icon: Package,
      href: "/portal/feature-packs",
    },
  ]);

  const workspaceSummary = filterSummary([
    {
      label: "Active businesses",
      value: businesses?.length || counts.registeredBusinesses,
      icon: Building2,
      href: "/portal/business-profile",
    },
    {
      label: "Registered users",
      value: workspaceUsers?.length || counts.registeredUsers,
      icon: Users,
      href: "/portal/users",
    },
    {
      label: "Branches",
      value: branches,
      icon: Building2,
      href: "/portal/organization",
    },
    {
      label: "Unread notifications",
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

  const accountActionItems =
    data.commercialJourney === "custom"
      ? [
          {
            href: "/portal/modules",
            label: "Manage modules",
            hint: "Add modules · Custom ERP only",
          },
          {
            href: "/portal/custom-erp",
            label: "Modify ERP configuration",
            hint: "Quote preview · license update",
          },
          {
            href: "/portal/billing",
            label: "Billing & payments",
            hint: "Gateways · payment history",
          },
          {
            href: "/portal/settings",
            label: "Security & password",
            hint: "2FA · Email OTP · strength",
          },
        ]
      : [
          {
            href: renewSubId
              ? `/portal/plans?intent=upgrade&subscription_id=${encodeURIComponent(renewSubId)}`
              : "/portal/plans?intent=upgrade",
            label: "Upgrade plan",
            hint: subscriptionActionsBlocked
              ? "Keep subscription to unlock upgrades"
              : "Industry · category · plan · price",
            disabled: subscriptionActionsBlocked,
          },
          {
            href: "/portal/plans?intent=new_place",
            label: "Create New Business",
            hint: "New business on same account",
          },
          {
            href: "/portal/billing",
            label: "Billing & payments",
            hint: "Gateways · payment history",
          },
          {
            href: "/portal/settings",
            label: "Security & password",
            hint: "2FA · Email OTP · strength",
          },
        ];

  const hasSummary =
    subscriptionSummary.length + licenseSummary.length + workspaceSummary.length > 0;

  return (
    <div className="space-y-8">
      <PortalDashboardPayBanner data={data} />
      <PortalPageHeader
        eyebrow="Customer success"
        title={`Welcome back, ${firstName}`}
        description={`${overview.company} · Live entitlements from your License Engine identity session.`}
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
              description="Primary entitlement from License Engine."
              action={
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href="/portal/licenses">License history</Link>
                </Button>
              }
            >
              {primary ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-semibold tracking-tight sm:text-lg">
                        {primary.product_name || "Product"} ·{" "}
                        {primary.plan_name ||
                          (String(primary.package_type || "").toLowerCase() === "custom" ||
                          primary.modules.length
                            ? "Custom package"
                            : "Plan")}
                      </p>
                      <p className="mt-2 break-all font-mono text-xs tracking-wide text-[var(--portal-muted)]">
                        {license?.keyMasked || primary.keyMasked || "—"}
                      </p>
                    </div>
                    <PortalStatusBadge status={primary.effective_status || primary.status} />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { label: "Activation", value: formatPortalDate(primary.activation_date) },
                      { label: "Expiry", value: formatPortalDate(primary.expiry_date) },
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
                    industry={overview.industry}
                    category={overview.businessCategory}
                    billingCycleFallback={data.subscriptions?.[0]?.billing_cycle}
                  />
                  <div className="flex flex-wrap gap-2">
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
                    ) : (
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
                              : undefined
                          }
                        >
                          {subscriptionActionsBlocked ? (
                            <span>Upgrade</span>
                          ) : (
                            <Link
                              href={
                                renewSubId
                                  ? `/portal/plans?intent=upgrade&subscription_id=${encodeURIComponent(renewSubId)}`
                                  : "/portal/plans?intent=upgrade"
                              }
                            >
                              Upgrade
                            </Link>
                          )}
                        </Button>
                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                          <Link href="/portal/plans?intent=new_place">Create New Business</Link>
                        </Button>
                      </>
                    )}
                    <Button asChild size="sm" variant="ghost" className="rounded-xl">
                      <Link href="/portal/billing">Payments</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <PortalEmptyState
                  title="No licenses yet"
                  description="Licenses issued by License Engine will appear here."
                  actionLabel="Open subscriptions"
                  actionHref="/portal/subscriptions"
                  icon={KeyRound}
                />
              )}
            </PortalPanel>
          </PortalFadeIn>

          <div className="grid gap-6 md:grid-cols-2">
            <PortalPanel
              title="Recent notifications"
              description="License and billing alerts."
              action={
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href="/portal/notifications">View all</Link>
                </Button>
              }
            >
              {(notifications || []).length ? (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {(notifications || []).slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-[var(--portal-border)] px-4 py-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 font-medium">{n.title}</p>
                        <PortalStatusBadge status={n.read ? "Read" : "Unread"} />
                      </div>
                      {n.created_at ? (
                        <p className="mt-1 text-xs text-[var(--portal-muted)]">
                          {formatPortalDate(n.created_at)}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <PortalEmptyState
                  title="No notifications"
                  description="Alerts from License Engine will appear here."
                  icon={Bell}
                />
              )}
            </PortalPanel>

            <PortalPanel
              title="Recent invoices"
              description="Billing documents from License Engine."
              action={
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href="/portal/invoices">View all</Link>
                </Button>
              }
            >
              {(invoices || []).length ? (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {(invoices || []).slice(0, 5).map((inv) => (
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
                  description="Invoices from License Engine billing will appear here."
                  icon={CreditCard}
                />
              )}
            </PortalPanel>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <PortalPanel title="Recent sessions" description="Active refresh sessions.">
              {sessions.length ? (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {sessions.slice(0, 5).map((session, idx) => (
                    <div
                      key={session.id || String(idx)}
                      className="flex flex-col gap-1 rounded-xl border border-[var(--portal-border)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="inline-flex min-w-0 items-center gap-2 text-[var(--portal-muted)]">
                        <Shield className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {formatPortalDate(session.created_at) || `Session ${idx + 1}`}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-[var(--portal-muted)]">
                        {session.expires_at
                          ? `Expires ${formatPortalDate(session.expires_at)}`
                          : "Active"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <PortalEmptyState
                  title="No sessions listed"
                  description="Session history will appear when available from License Engine."
                  icon={Shield}
                />
              )}
            </PortalPanel>

            <PortalPanel title="Modules & feature packs">
              {modules.length || featurePacks.length ? (
                <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto pr-1">
                  {modules.map((m) => (
                    <span
                      key={`m-${m}`}
                      className="rounded-full border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3 py-1.5 text-xs font-medium"
                    >
                      {m}
                    </span>
                  ))}
                  {featurePacks.map((f) => (
                    <span
                      key={`f-${f}`}
                      className="rounded-full bg-[var(--portal-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--portal-primary)]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              ) : (
                <PortalEmptyState
                  title="No modules assigned"
                  description="Installed modules and feature packs will show here."
                  actionLabel="View modules"
                  actionHref="/portal/modules"
                  icon={Package}
                />
              )}
            </PortalPanel>
          </div>

          <PortalPanel
            title="Account trust"
            description="WaamTech platform security features protecting your customer portal."
          >
            <TrustBadgeStrip
              set="portal"
              tone="auto"
              size="sm"
              href={false}
              className="justify-start sm:justify-center"
            />
          </PortalPanel>
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
                  title="Licenses & entitlements"
                  items={licenseSummary}
                  columns={1}
                  compact
                />
              ) : null}
              {workspaceSummary.length ? (
                <DashboardSummarySection
                  title="Workspace & alerts"
                  items={workspaceSummary}
                  columns={1}
                  compact
                />
              ) : null}
            </div>
          ) : null}

          <section
            aria-label="Portal actions"
            className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-4 sm:p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
              Account actions
            </p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              {data.commercialJourney === "custom"
                ? "Modules, configuration, billing, and security."
                : "Upgrade, new business, billing, and security."}
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

          <PortalPanel title="Quick actions" description="Common customer success tasks.">
            <div className="max-h-[min(24rem,calc(100vh-12rem))] space-y-2 overflow-y-auto pr-1">
              {quickActions.map((action, i) =>
                action.external ? (
                  <motion.a
                    key={action.id}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="portal-focus-ring flex items-center justify-between rounded-xl border border-[var(--portal-border)] px-4 py-3 text-sm font-medium transition hover:border-[var(--portal-primary)]/25 hover:bg-[var(--portal-soft)]"
                  >
                    <span className="min-w-0 pr-2">{action.label}</span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
                  </motion.a>
                ) : (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={action.href}
                      className="portal-focus-ring flex items-center justify-between rounded-xl border border-[var(--portal-border)] px-4 py-3 text-sm font-medium transition hover:border-[var(--portal-primary)]/25 hover:bg-[var(--portal-soft)]"
                    >
                      <span className="min-w-0 pr-2">{action.label}</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
                    </Link>
                  </motion.div>
                )
              )}
            </div>
          </PortalPanel>
        </aside>
      </div>
    </div>
  );
}
