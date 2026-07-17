"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  Factory,
  KeyRound,
  Package,
  RefreshCw,
  Shield,
  Tags,
  Ticket,
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
  } = data;

  const erpObj = (erp || {}) as Record<string, unknown>;
  const branches =
    typeof erpObj.branches === "number"
      ? erpObj.branches
      : typeof erpObj.branch_count === "number"
        ? erpObj.branch_count
        : null;

  const summary = [
    {
      label: "Subscription",
      value: subscription?.currentPlan || subscription?.status || null,
      hint: subscription?.status,
      icon: Package,
      tone: "default" as const,
      href: "/portal/subscriptions",
    },
    {
      label: "License status",
      value: license?.status || null,
      hint: license?.productName,
      icon: KeyRound,
      tone: "success" as const,
      href: "/portal/licenses",
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
      value: counts.registeredUsers,
      icon: Users,
      href: "/portal/users",
    },
    {
      label: "Organizations",
      value: counts.registeredBusinesses,
      icon: Building2,
      href: "/portal/organization",
    },
    {
      label: "Branches",
      value: branches,
      icon: Building2,
      href: "/portal/organization",
    },
    {
      label: "Active modules",
      value: modules.length || null,
      hint: modules.slice(0, 3).join(", ") || null,
      icon: Package,
      href: "/portal/modules",
    },
    {
      label: "Business category",
      value: overview.businessCategory,
      icon: Tags,
      href: "/portal/business-profile",
    },
    {
      label: "Industry",
      value: overview.industry,
      icon: Factory,
      href: "/portal/business-profile",
    },
    {
      label: "Support tickets",
      value: counts.openTickets,
      icon: Ticket,
      tone: "danger" as const,
      href: "/portal/support",
    },
    {
      label: "Next invoice",
      value: billing?.nextInvoice || null,
      icon: CreditCard,
      href: "/portal/invoices",
    },
    {
      label: "Outstanding balance",
      value: billing?.outstandingBalance || null,
      icon: CreditCard,
      tone: "warning" as const,
      href: "/portal/billing",
    },
  ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "");

  const primary = licenses[0];
  const firstName = overview.customerName.split(" ")[0] || "there";

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
                    <Link href="/portal/subscriptions">Renew</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href="/portal/licenses">Download license</Link>
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
    </div>
  );
}
