"use client";

import Link from "next/link";
import {
  Bell,
  Building2,
  CreditCard,
  Download,
  FileText,
  KeyRound,
  Package,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { formatPortalDate } from "@/components/portal/use-portal-data";
import { PortalBusinessProfileView } from "@/components/portal/portal-business-profile";
import { PortalInvoicesView } from "@/components/portal/portal-invoices";
import { PortalNotificationsView } from "@/components/portal/portal-notifications";
import { PortalSettingsView } from "@/components/portal/portal-settings";
import {
  PortalDataRow,
  PortalEmptyState,
  PortalErrorState,
  PortalPageHeader,
  PortalPanel,
  PortalSkeleton,
  PortalStatusBadge,
  PortalUsageMeter,
} from "@/components/portal/portal-ui";

export type PortalSectionKey =
  | "licenses"
  | "subscriptions"
  | "billing"
  | "invoices"
  | "users"
  | "organization"
  | "modules"
  | "business-profile"
  | "notifications"
  | "settings";

function plansHref(
  intent: "renew" | "upgrade" | "new_place",
  subscriptionId?: string | null
) {
  const q = new URLSearchParams({ intent });
  if (subscriptionId) q.set("subscription_id", subscriptionId);
  return `/portal/plans?${q.toString()}`;
}

const META: Record<
  PortalSectionKey,
  { title: string; description: string; emptyTitle: string; emptyDescription: string; eyebrow: string }
> = {
  licenses: {
    title: "Licenses",
    description: "Entitlements, expiry, and masked license keys from License Engine.",
    emptyTitle: "No licenses",
    emptyDescription: "Licenses will appear once issued by License Engine.",
    eyebrow: "Entitlements",
  },
  subscriptions: {
    title: "Subscriptions",
    description: "Current plan, trial status, renewal, and billing cycle signals.",
    emptyTitle: "No subscription data",
    emptyDescription: "Subscription details are derived from your licenses.",
    eyebrow: "Plan",
  },
  billing: {
    title: "Billing & payments",
    description:
      "Payment gateways, payment history, renewals, and outstanding balance from License Engine.",
    emptyTitle: "Billing not available yet",
    emptyDescription:
      "Payment methods and history appear when License Engine billing APIs respond for your session.",
    eyebrow: "Finance",
  },
  invoices: {
    title: "Invoices",
    description: "Invoice history, amounts, payment status, and downloadable PDFs.",
    emptyTitle: "No invoices yet",
    emptyDescription: "Invoice history will appear when available for your identity session.",
    eyebrow: "Finance",
  },
  users: {
    title: "Users",
    description: "Workspace users provisioned via License Engine and WAAMTO ERP Cloud.",
    emptyTitle: "No users yet",
    emptyDescription: "Users set up from SaaS through your license will appear here.",
    eyebrow: "Workspace",
  },
  organization: {
    title: "Organizations",
    description: "Workspace, companies, branches, warehouses, and geography.",
    emptyTitle: "Organization profile unavailable",
    emptyDescription: "Organization fields from License Engine and optional ERP data appear here.",
    eyebrow: "Workspace",
  },
  modules: {
    title: "Modules",
    description: "Installed products, enabled modules, and feature packs.",
    emptyTitle: "No modules assigned",
    emptyDescription: "Modules appear from licenses and optional ERP workspace data.",
    eyebrow: "Products",
  },
  "business-profile": {
    title: "Business profile",
    description: "Company identity, industry, category, and customer since date.",
    emptyTitle: "Profile unavailable",
    emptyDescription: "Business profile fields will show when returned by License Engine.",
    eyebrow: "Company",
  },
  notifications: {
    title: "Notifications",
    description: "License, invoice, security, and system alerts.",
    emptyTitle: "You're all caught up",
    emptyDescription: "Notifications from License Engine will appear in this center.",
    eyebrow: "Alerts",
  },
  settings: {
    title: "Settings",
    description:
      "Profile, password strength, Email OTP, authenticator 2FA, recovery codes, and sessions.",
    emptyTitle: "Settings unavailable",
    emptyDescription: "Account settings load from your License Engine identity.",
    eyebrow: "Account",
  },
};

export function PortalSectionPage({ section }: { section: PortalSectionKey }) {
  const meta = META[section];
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={2} />;
  if (error || !data) {
    return <PortalErrorState message={error || "Something went wrong."} onRetry={reload} />;
  }

  const erp = (data.erp || {}) as Record<string, unknown>;
  let body: React.ReactNode = null;
  let flush = false;

  if (section === "licenses") {
    const primarySubId =
      data.subscriptions?.find((s) =>
        ["active", "trial", "trialing", "grace", "suspended"].includes(
          String(s.status || "").toLowerCase()
        )
      )?.id || data.subscriptions?.[0]?.id || null;
    body = data.licenses.length ? (
      <div className="space-y-4">
        {data.licenses.map((lic) => {
          const linkedSubId =
            data.subscriptions?.find((s) => s.license_id === lic.id)?.id || primarySubId;
          return (
          <article
            key={lic.id}
            className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-soft)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold tracking-tight">
                  {lic.product_name || "Product"} · {lic.plan_name || "Plan"}
                </p>
                <p className="mt-2 font-mono text-xs tracking-wide text-[var(--portal-muted)]">
                  {lic.keyMasked || "—"}
                </p>
              </div>
              <PortalStatusBadge status={lic.effective_status || lic.status} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: "License type", value: lic.plan_type || lic.deployment_type || null },
                { label: "Activation", value: formatPortalDate(lic.activation_date) },
                { label: "Expiry", value: formatPortalDate(lic.expiry_date) },
              ]
                .filter((r) => r.value)
                .map((r) => (
                  <div key={r.label}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                      {r.label}
                    </p>
                    <p className="mt-1 text-sm font-medium capitalize">{r.value}</p>
                  </div>
                ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-xl">
                <Link href={plansHref("renew", linkedSubId)}>Renew</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <Link href={plansHref("upgrade", linkedSubId)}>Upgrade</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <Link href={plansHref("new_place")}>Create New Business</Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl" disabled title="Available when License Engine exposes downloadable license files">
                <Download className="h-4 w-4" />
                Download license
              </Button>
              <Button asChild size="sm" variant="ghost" className="rounded-xl">
                <Link href="/portal/licenses">License history</Link>
              </Button>
            </div>
          </article>
          );
        })}
      </div>
    ) : null;
  }

  if (section === "subscriptions") {
    const commercial = data.subscriptions || [];
    if (commercial.length) {
      flush = true;
      body = (
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th scope="col">Subscription</th>
                <th scope="col">Plan</th>
                <th scope="col">Status</th>
                <th scope="col">Billing cycle</th>
                <th scope="col">Renewal</th>
                <th scope="col">Auto renew</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commercial.map((sub) => (
                <tr key={sub.id}>
                  <td className="font-medium">
                    {sub.subscription_number || sub.product_name || sub.id}
                  </td>
                  <td>{sub.plan_name || "—"}</td>
                  <td>
                    <PortalStatusBadge status={sub.status} />
                  </td>
                  <td>{sub.billing_cycle || "—"}</td>
                  <td>{formatPortalDate(sub.renewal_date || sub.expiry_date) || "—"}</td>
                  <td>{sub.auto_renewal ? "Enabled" : "Off"}</td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      <Button asChild size="sm" className="rounded-lg h-8">
                        <Link href={plansHref("renew", sub.id)}>Renew</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="rounded-lg h-8">
                        <Link href={plansHref("upgrade", sub.id)}>Upgrade</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="rounded-lg h-8">
                        <Link href={plansHref("new_place")}>Create New Business</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      const rows = data.subscription
        ? [
            { label: "Current plan", value: data.subscription.currentPlan },
            { label: "Status", value: data.subscription.status },
            { label: "Trial status", value: data.subscription.trialStatus },
            {
              label: "Trial remaining",
              value:
                data.subscription.trialRemainingDays != null
                  ? `${data.subscription.trialRemainingDays} days`
                  : null,
            },
            { label: "Renewal / expiry", value: formatPortalDate(data.subscription.renewalDate) },
            { label: "Billing cycle", value: (erp.billing_cycle as string) || null },
            {
              label: "Auto renewal",
              value:
                typeof erp.auto_renewal === "boolean"
                  ? erp.auto_renewal
                    ? "Enabled"
                    : "Disabled"
                  : null,
            },
          ].filter((r) => r.value)
        : [];
      body = rows.length ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <PortalDataRow key={r.label} label={r.label} value={r.value} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-xl">
                <Link href={plansHref("renew", data.subscriptions?.[0]?.id)}>Renew</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <Link href={plansHref("upgrade", data.subscriptions?.[0]?.id)}>Upgrade</Link>
              </Button>
          </div>
          <p className="text-xs text-[var(--portal-muted)]">
            Subscriptions load from License Engine public billing APIs.
          </p>
        </div>
      ) : null;
    }
  }

  if (section === "invoices") {
    flush = true;
    body = <PortalInvoicesView />;
  }

  if (section === "billing") {
    const payments = data.payments || [];
    const renewals = data.renewals || [];
    const gateways = data.gateways || [];
    const availableGateways = gateways.filter((g) => g.configured || g.online);
    const rows = [
      { label: "Next invoice / renewal", value: data.billing?.nextInvoice },
      { label: "Outstanding balance", value: data.billing?.outstandingBalance },
      { label: "Current plan", value: data.subscription?.currentPlan },
      {
        label: "Billing cycle",
        value:
          data.subscriptions?.[0]?.billing_cycle ||
          (typeof erp.billing_cycle === "string" ? erp.billing_cycle : null),
      },
      {
        label: "Auto renewal",
        value:
          typeof data.subscriptions?.[0]?.auto_renewal === "boolean"
            ? data.subscriptions[0].auto_renewal
              ? "Enabled"
              : "Disabled"
            : typeof erp.auto_renewal === "boolean"
              ? erp.auto_renewal
                ? "Enabled"
                : "Disabled"
              : null,
      },
      {
        label: "Payment gateways",
        value: availableGateways.length
          ? availableGateways.map((g) => g.label || g.id).join(", ")
          : null,
      },
      { label: "Payments on file", value: payments.length ? String(payments.length) : null },
      { label: "Renewals", value: renewals.length ? String(renewals.length) : null },
    ].filter((r) => r.value);
    body = rows.length || payments.length || renewals.length || availableGateways.length ? (
      <div className="space-y-6">
        {rows.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <PortalDataRow key={r.label} label={r.label} value={r.value} />
            ))}
          </div>
        ) : null}
        {availableGateways.length ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--portal-ink)]">
              Available payment methods
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableGateways.map((g) => (
                <li
                  key={g.id}
                  className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm"
                >
                  <p className="font-medium capitalize text-[var(--portal-fg)]">
                    {g.label || g.id}
                  </p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    {g.online ? "Online" : "Configured"}
                    {g.configured ? " · Ready for checkout" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {payments.length ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--portal-ink)]">Payment history</p>
            <div className="portal-table-wrap">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th scope="col">Transaction</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Gateway</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 15).map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">
                        {p.transaction_id || p.reference_number || p.id}
                      </td>
                      <td className="tabular-nums">
                        {p.currency} {Number(p.amount).toFixed(2)}
                      </td>
                      <td className="capitalize">{p.gateway || "—"}</td>
                      <td>
                        <PortalStatusBadge status={p.status} />
                      </td>
                      <td>{formatPortalDate(p.paid_date) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--portal-border)] px-4 py-6 text-sm text-[var(--portal-muted)]">
            No payments yet. Renew or upgrade a plan to start a checkout payment.
          </div>
        )}
        {renewals.length ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--portal-ink)]">Renewals</p>
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
                  {renewals.slice(0, 10).map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.id}</td>
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
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/portal/plans?intent=renew">Pay / renew</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/portal/invoices">View invoices</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/portal/subscriptions">Manage subscription</Link>
          </Button>
        </div>
      </div>
    ) : (
      <PortalEmptyState
        title="No billing activity yet"
        description="Payment gateways, invoices, and payment history from License Engine will appear here after your first renewal or upgrade."
        actionLabel="Go to plans"
        actionHref="/portal/plans?intent=renew"
      />
    );
  }

  if (section === "users") {
    const users = data.workspaceUsers || [];
    const userLimit = typeof erp.user_limit === "number" ? erp.user_limit : null;
    const licensed = data.counts.licensedUsers ?? users.length;
    const registered = data.counts.registeredUsers ?? users.length;
    const rows = [
      { label: "Registered users", value: registered },
      { label: "Licensed users", value: licensed },
      { label: "User limit", value: userLimit },
      {
        label: "Usage",
        value:
          licensed != null && userLimit != null ? `${licensed} / ${userLimit}` : null,
      },
    ].filter((r) => r.value !== null && r.value !== undefined);
    body = users.length || rows.length ? (
      <div className="space-y-5">
        {rows.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((r) => (
              <PortalDataRow key={r.label} label={r.label} value={String(r.value)} />
            ))}
          </div>
        ) : null}
        {licensed != null && userLimit != null && userLimit > 0 ? (
          <PortalUsageMeter label="Seat usage" used={Number(licensed)} limit={userLimit} />
        ) : null}
        {users.length ? (
          <div className="portal-table-wrap">
            <table className="portal-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Username</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last login</th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.full_name || "—"}</td>
                    <td>{user.email || "—"}</td>
                    <td>{user.username || "—"}</td>
                    <td>
                      <PortalStatusBadge status={user.status} />
                    </td>
                    <td>{formatPortalDate(user.last_login_at) || "—"}</td>
                    <td>{formatPortalDate(user.created_at) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    ) : null;
  }

  if (section === "organization") {
    const rows = [
      { label: "Workspace", value: data.overview.company },
      { label: "Customer name", value: data.overview.customerName },
      { label: "Primary email", value: data.overview.primaryEmail },
      { label: "Country", value: data.overview.country },
      { label: "Industry", value: data.overview.industry },
      { label: "Business category", value: data.overview.businessCategory },
      { label: "Status", value: data.overview.status },
      { label: "Customer since", value: formatPortalDate(data.overview.customerSince) },
      {
        label: "Companies",
        value:
          data.counts.registeredBusinesses != null
            ? String(data.counts.registeredBusinesses)
            : null,
      },
      {
        label: "Branches",
        value:
          typeof erp.branches === "number"
            ? String(erp.branches)
            : typeof erp.branch_count === "number"
              ? String(erp.branch_count)
              : null,
      },
      {
        label: "Warehouses",
        value:
          typeof erp.warehouses === "number"
            ? String(erp.warehouses)
            : typeof erp.warehouse_count === "number"
              ? String(erp.warehouse_count)
              : null,
      },
    ].filter((r) => r.value);
    body = rows.length ? (
      <div className="space-y-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <PortalDataRow key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
        <PortalBusinessProfileView embedded />
      </div>
    ) : (
      <PortalBusinessProfileView />
    );
  }

  if (section === "business-profile") {
    body = <PortalBusinessProfileView />;
  }

  if (section === "modules") {
    const items = [...data.modules, ...data.featurePacks];
    body = items.length ? (
      <div className="space-y-6">
        {data.modules.length ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--portal-muted)]">
              Installed / enabled modules
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.modules.map((m) => (
                <div
                  key={m}
                  className="flex items-center gap-3 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                    <Package className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m}</p>
                    <p className="text-xs text-[var(--portal-muted)]">Enabled</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {data.featurePacks.length ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--portal-muted)]">
              Feature packs
            </p>
            <div className="flex flex-wrap gap-2">
              {data.featurePacks.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-[var(--portal-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--portal-primary)]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {typeof erp.version === "string" ? (
          <PortalDataRow label="Version" value={erp.version} />
        ) : null}
      </div>
    ) : null;
  }

  if (section === "notifications") {
    body = <PortalNotificationsView />;
  }

  if (section === "settings") {
    body = <PortalSettingsView />;
  }

  const emptyIcons = {
    licenses: KeyRound,
    subscriptions: Package,
    billing: CreditCard,
    invoices: FileText,
    users: Users,
    organization: Building2,
    modules: Package,
    "business-profile": Building2,
    notifications: Bell,
    settings: Settings,
  } as const;

  const billingSection =
    section === "subscriptions" || section === "invoices" || section === "billing";
  const billingUnavailable =
    billingSection && data.commercialBilling && !data.commercialBilling.ok;
  const billingPartial =
    billingSection &&
    data.commercialBilling &&
    data.commercialBilling.ok &&
    !(
      data.commercialBilling.subscriptionsOk &&
      data.commercialBilling.invoicesOk &&
      data.commercialBilling.paymentsOk &&
      data.commercialBilling.renewalsOk
    );

  return (
    <div>
      <PortalPageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        actions={
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {billingUnavailable && !body ? (
        <PortalErrorState
          message={
            data.commercialBilling?.message ||
            "Billing data is temporarily unavailable from License Engine."
          }
          onRetry={reload}
        />
      ) : (
        <PortalPanel title={meta.title} flush={flush && Boolean(body)}>
          {billingUnavailable || billingPartial ? (
            <div
              className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-black"
              role="status"
            >
              {billingUnavailable
                ? data.commercialBilling?.message ||
                  "Billing services are temporarily unavailable. Showing any cached identity data only."
                : "Some billing endpoints did not respond. Lists may be incomplete."}{" "}
              <button
                type="button"
                className="font-medium underline underline-offset-2"
                onClick={() => void reload()}
              >
                Retry
              </button>
            </div>
          ) : null}
          {body ? (
            body
          ) : (
            <PortalEmptyState
              title={meta.emptyTitle}
              description={meta.emptyDescription}
              icon={emptyIcons[section]}
              actionLabel={undefined}
              actionHref={undefined}
            />
          )}
        </PortalPanel>
      )}
    </div>
  );
}
