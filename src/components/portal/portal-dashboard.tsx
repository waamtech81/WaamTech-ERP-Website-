"use client";

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
import { TrustBadgeStrip } from "@/components/trust-badges";

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

  const summary = [
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
      label: "Active businesses",
      value: businesses?.length || counts.registeredBusinesses,
      icon: Building2,
      href: "/portal/business-profile",
    },
    {
      label: "Current plan",
      value: subscription?.currentPlan || subscription?.status || null,
      hint: subscription?.status,
      icon: Package,
      tone: "default" as const,
      href: "/portal/subscriptions",
    },
    {
      label: "Expiring licenses",
      value: expiringLicenses || null,
      icon: Calendar,
      tone: "warning" as const,
      href: "/portal/licenses",
    },
    {
      label: "Unread notifications",
      value: unreadNotifications || null,
      icon: Bell,
      href: "/portal/notifications",
    },
    {
      label: "Recent invoices",
      value: invoices?.length || null,
      icon: CreditCard,
      href: "/portal/invoices",
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
  ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "");

  const primary = licenses[0];
  const firstName = overview.customerName.split(" ")[0] || "there";
  const expiredOrExpiring = licenses.filter((l) => {
    const status = String(l.effective_status || l.status || "").toLowerCase();
    if (["expired", "suspended"].includes(status)) return true;
    return typeof l.days_remaining === "number" && l.days_remaining <= 14;
  });
  const renewSubId =
    data.subscriptions?.find((s) =>
      ["active", "trial", "trialing", "grace", "suspended", "expired"].includes(
        String(s.status || "").toLowerCase()
      )
    )?.id || data.subscriptions?.[0]?.id;

  return (
    <div className="space-y-8">
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

      {/* Always-visible account actions after login */}
      <section
        aria-label="Portal actions"
        className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-4 sm:p-5"
      >
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
              Account actions
            </p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Upgrade, add a place, billing payments, and security — available after login.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: renewSubId
                ? `/portal/plans?intent=upgrade&subscription_id=${encodeURIComponent(renewSubId)}`
                : "/portal/plans?intent=upgrade",
              label: "Upgrade plan",
              hint: "Industry · category · plan · price",
            },
            {
              href: "/portal/plans?intent=new_place",
              label: "Add new place",
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
          ].map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="portal-focus-ring rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 transition hover:border-[var(--portal-primary)]/40 hover:bg-[var(--portal-primary-soft)]"
            >
              <p className="text-sm font-semibold text-[var(--portal-fg)]">{item.label}</p>
              <p className="mt-1 text-xs text-[var(--portal-muted)]">{item.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      {data.accessNotice ? (
        <div
          role="status"
          className={
            data.accessNotice.level === "danger"
              ? "rounded-2xl border border-rose-500/25 bg-rose-500/10 px-5 py-4"
              : data.accessNotice.level === "warning"
                ? "rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4"
                : "rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-5 py-4"
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[var(--portal-fg)]">
                  {data.accessNotice.title}
                </p>
                <PortalStatusBadge status={data.accessNotice.status} />
              </div>
              <p className="text-sm text-[var(--portal-muted)]">{data.accessNotice.message}</p>
            </div>
            {data.accessNotice.actionHref ? (
              <Button asChild size="sm" className="rounded-xl">
                <Link href={data.accessNotice.actionHref}>
                  {data.accessNotice.actionLabel || "Continue"}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {expiredOrExpiring.length ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-950 dark:text-amber-100"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">License attention required</p>
              <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
                {expiredOrExpiring.length} license
                {expiredOrExpiring.length === 1 ? "" : "s"} expired or renewing soon. Check
                notifications and renew to keep access.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-xl">
                <Link
                  href={
                    renewSubId
                      ? `/portal/plans?intent=renew&subscription_id=${encodeURIComponent(renewSubId)}`
                      : "/portal/plans?intent=renew"
                  }
                >
                  Renew now
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <Link href="/portal/notifications">View alerts</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {summary.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <PortalStatCard
              key={item.label}
              label={item.label}
              value={
                typeof item.value === "number" ? <Counter value={item.value} /> : String(item.value)
              }
              hint={item.hint}
              icon={item.icon}
              tone={item.tone}
              href={item.href}
            />
          ))}
        </div>
      ) : (
        <PortalEmptyState
          title="Overview will appear here"
          description="Summary cards populate from your licenses, subscription, and optional workspace stats."
          actionLabel="View licenses"
          actionHref="/portal/licenses"
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold tracking-tight">
                      {primary.product_name || "Product"} · {primary.plan_name || "Plan"}
                    </p>
                    <p className="mt-2 font-mono text-xs tracking-wide text-[var(--portal-muted)]">
                      {license?.keyMasked || primary.keyMasked || "—"}
                    </p>
                  </div>
                  <PortalStatusBadge status={primary.effective_status || primary.status} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
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
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" className="rounded-xl">
                    <Link
                      href={
                        renewSubId
                          ? `/portal/plans?intent=renew&subscription_id=${encodeURIComponent(renewSubId)}`
                          : "/portal/plans?intent=renew"
                      }
                    >
                      Renew
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link
                      href={
                        renewSubId
                          ? `/portal/plans?intent=upgrade&subscription_id=${encodeURIComponent(renewSubId)}`
                          : "/portal/plans?intent=upgrade"
                      }
                    >
                      Upgrade
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href="/portal/plans?intent=new_place">Add place</Link>
                  </Button>
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

        <PortalFadeIn delay={0.05}>
          <PortalPanel title="Quick actions" description="Common customer success tasks.">
            <div className="space-y-2">
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
                    <span>{action.label}</span>
                    <ExternalLink className="h-4 w-4 text-[var(--portal-muted)]" />
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
                      <span>{action.label}</span>
                      <ArrowUpRight className="h-4 w-4 text-[var(--portal-muted)]" />
                    </Link>
                  </motion.div>
                )
              )}
            </div>
          </PortalPanel>
        </PortalFadeIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
            <div className="space-y-2">
              {(notifications || []).slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-[var(--portal-border)] px-4 py-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{n.title}</p>
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
          action={
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/portal/invoices">View all</Link>
            </Button>
          }
        >
          {(invoices || []).length ? (
            <div className="space-y-2">
              {(invoices || []).slice(0, 5).map((inv) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <PortalPanel title="Recent sessions" description="Active refresh sessions.">
          {sessions.length ? (
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session, idx) => (
                <div
                  key={session.id || String(idx)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--portal-border)] px-4 py-3 text-sm"
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
            <div className="flex flex-wrap gap-2">
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
  );
}
