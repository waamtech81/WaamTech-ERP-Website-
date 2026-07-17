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
  Shield,
  Ticket,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { formatPortalDate, formatPortalDateTime } from "@/components/portal/use-portal-data";
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
import { siteConfig } from "@/lib/data/site";

export type PortalSectionKey =
  | "licenses"
  | "subscriptions"
  | "billing"
  | "invoices"
  | "users"
  | "organization"
  | "modules"
  | "support"
  | "business-profile"
  | "notifications"
  | "settings";

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
    title: "Billing",
    description: "Outstanding balance and next invoice when available.",
    emptyTitle: "Billing not available yet",
    emptyDescription:
      "Billing details appear when License Engine or workspace stats expose them to your session.",
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
    description: "Licensed seats, registered users, and usage against your plan.",
    emptyTitle: "User counts unavailable",
    emptyDescription: "Connect optional ERP stats to show registered and licensed users.",
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
  support: {
    title: "Support tickets",
    description: "Open, pending, and closed tickets for your workspace.",
    emptyTitle: "No ticket data yet",
    emptyDescription:
      "Ticket lists appear when Engine support APIs are available for identity sessions.",
    eyebrow: "Help",
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
    description: "Profile, identity provider, security, and active sessions.",
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
    body = data.licenses.length ? (
      <div className="space-y-4">
        {data.licenses.map((lic) => (
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
                <Link href="/portal/subscriptions">Renew</Link>
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
        ))}
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
              <Link href="/pricing">Renew</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link href="/pricing">Upgrade</Link>
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
    const invoices = data.invoices || [];
    if (invoices.length) {
      flush = true;
      body = (
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col">Due date</th>
                <th scope="col">Amount</th>
                <th scope="col">Payment</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="font-medium">{invoice.number}</td>
                  <td>
                    <PortalStatusBadge status={invoice.status} />
                  </td>
                  <td>{formatPortalDate(invoice.date) || "—"}</td>
                  <td>{formatPortalDate(invoice.dueDate) || "—"}</td>
                  <td className="tabular-nums font-medium">{invoice.amount || "—"}</td>
                  <td>
                    <PortalStatusBadge status={invoice.paymentStatus} />
                  </td>
                  <td>
                    {invoice.pdfUrl ? (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--portal-primary)] hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--portal-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      body = null;
    }
  }

  if (section === "billing") {
    const payments = data.payments || [];
    const renewals = data.renewals || [];
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
      { label: "Payments on file", value: payments.length ? String(payments.length) : null },
      { label: "Renewals", value: renewals.length ? String(renewals.length) : null },
    ].filter((r) => r.value);
    body = rows.length || payments.length || renewals.length ? (
      <div className="space-y-6">
        {rows.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <PortalDataRow key={r.label} label={r.label} value={r.value} />
            ))}
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
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">
                        {p.transaction_id || p.reference_number || p.id}
                      </td>
                      <td className="tabular-nums">
                        {p.currency} {Number(p.amount).toFixed(2)}
                      </td>
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
        ) : null}
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
            <Link href="/portal/invoices">View invoices</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/portal/subscriptions">Manage subscription</Link>
          </Button>
        </div>
      </div>
    ) : null;
  }

  if (section === "users") {
    const userLimit = typeof erp.user_limit === "number" ? erp.user_limit : null;
    const licensed = data.counts.licensedUsers;
    const registered = data.counts.registeredUsers;
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
    body = rows.length ? (
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((r) => (
            <PortalDataRow key={r.label} label={r.label} value={String(r.value)} />
          ))}
        </div>
        {licensed != null && userLimit != null && userLimit > 0 ? (
          <PortalUsageMeter label="Seat usage" used={licensed} limit={userLimit} />
        ) : null}
      </div>
    ) : null;
  }

  if (section === "organization" || section === "business-profile") {
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <PortalDataRow key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    ) : null;
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

  if (section === "support") {
    const tickets = Array.isArray(erp.tickets) ? (erp.tickets as Array<Record<string, unknown>>) : [];
    body = (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <PortalDataRow
            label="Open tickets"
            value={data.counts.openTickets != null ? String(data.counts.openTickets) : "—"}
          />
          <PortalDataRow
            label="Pending tickets"
            value={data.counts.pendingTickets != null ? String(data.counts.pendingTickets) : "—"}
          />
          <PortalDataRow
            label="Closed tickets"
            value={data.counts.closedTickets != null ? String(data.counts.closedTickets) : "—"}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="rounded-xl">
            <a href={`mailto:${siteConfig.supportEmail}?subject=Support%20ticket`}>
              <Ticket className="h-4 w-4" />
              Create ticket
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <a href={`mailto:${siteConfig.supportEmail}`}>Email support</a>
          </Button>
        </div>
        {tickets.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--portal-muted)]">
              Timeline
            </p>
            {tickets.slice(0, 8).map((ticket, index) => (
              <div
                key={String(ticket.id || index)}
                className="rounded-xl border border-[var(--portal-border)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {String(ticket.subject || ticket.title || `Ticket ${index + 1}`)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <PortalStatusBadge
                      status={ticket.priority != null ? String(ticket.priority) : null}
                    />
                    <PortalStatusBadge
                      status={ticket.status != null ? String(ticket.status) : null}
                    />
                  </div>
                </div>
                {ticket.updated_at || ticket.created_at ? (
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    {formatPortalDateTime(
                      String(ticket.updated_at || ticket.created_at || "")
                    )}
                  </p>
                ) : null}
                {ticket.latest_reply ? (
                  <p className="mt-2 text-sm text-[var(--portal-muted)]">
                    {String(ticket.latest_reply)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <PortalEmptyState
            title="Ticket timeline coming soon"
            description="When support tickets are available for your identity session, open/pending/closed lists and recent replies will render here."
            icon={Ticket}
          />
        )}
      </div>
    );
  }

  if (section === "notifications") {
    const notifications = data.notifications || [];
    body = notifications.length ? (
      <div className="space-y-2">
        {notifications.map((n) => {
          const category = (n.category || "system").toLowerCase();
          return (
            <div
              key={n.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-[var(--portal-border)] px-4 py-3.5"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body ? (
                    <p className="mt-1 text-sm text-[var(--portal-muted)]">{n.body}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <PortalStatusBadge status={category} />
                    {n.created_at ? (
                      <span className="text-xs text-[var(--portal-muted)]">
                        {formatPortalDateTime(n.created_at)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <PortalStatusBadge status={n.read ? "Read" : "Unread"} />
            </div>
          );
        })}
      </div>
    ) : null;
  }

  if (section === "settings") {
    body = (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <PortalDataRow label="Customer name" value={data.overview.customerName} />
          <PortalDataRow label="Primary email (read only)" value={data.overview.primaryEmail} />
          <PortalDataRow label="Username (read only)" value={data.identity.username} />
          <PortalDataRow label="Identity provider" value="License Engine" />
          <PortalDataRow label="Security" value={data.identity.status} />
          <PortalDataRow label="Last login" value={formatPortalDateTime(data.overview.lastLogin)} />
        </div>
        <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-soft)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--portal-fg)]">Sessions</h3>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              Active refresh sessions from License Engine.
            </p>
          </div>
          {data.sessions.length ? (
            <div className="space-y-2">
              {data.sessions.map((s, i) => (
                <div
                  key={s.id || String(i)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-panel)] px-4 py-3 text-sm"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-[var(--portal-muted)]">
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {formatPortalDateTime(s.created_at) || `Session ${i + 1}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--portal-muted)]">
                    {s.expires_at ? `Expires ${formatPortalDate(s.expires_at)}` : "Active"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--portal-muted)]">No active sessions listed.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/forgot-password">Manage password</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/portal/business-profile">Manage account</Link>
          </Button>
        </div>
      </div>
    );
  }

  const emptyIcons = {
    licenses: KeyRound,
    subscriptions: Package,
    billing: CreditCard,
    invoices: FileText,
    users: Users,
    organization: Building2,
    modules: Package,
    support: Ticket,
    "business-profile": Building2,
    notifications: Bell,
    settings: Settings,
  } as const;

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

      <PortalPanel title={meta.title} flush={flush && Boolean(body)}>
        {body ? (
          body
        ) : (
          <PortalEmptyState
            title={meta.emptyTitle}
            description={meta.emptyDescription}
            icon={emptyIcons[section]}
            actionLabel={section === "support" ? "Create ticket" : undefined}
            actionHref={
              section === "support"
                ? `mailto:${siteConfig.supportEmail}?subject=Support%20ticket`
                : undefined
            }
          />
        )}
      </PortalPanel>
    </div>
  );
}
