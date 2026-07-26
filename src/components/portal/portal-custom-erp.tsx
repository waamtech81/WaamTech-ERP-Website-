"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CreditCard,
  ExternalLink,
  FileText,
  Gauge,
  KeyRound,
  LifeBuoy,
  Package,
  Puzzle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { formatPortalDate } from "@/components/portal/use-portal-data";
import { PortalLicenseEntitlements } from "@/components/portal/portal-license-detail";
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
import { primaryPortalLicense } from "@/lib/portal/package-type";
import { authConfig } from "@/lib/auth/config";

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

export type CustomErpSectionKey =
  | "modules"
  | "feature-packs"
  | "limits"
  | "custom-erp"
  | "support";

/** Custom ERP customer dashboard — no predefined plan upgrade/compare surfaces. */
export function PortalCustomErpDashboardView() {
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={3} />;
  if (error || !data) {
    return <PortalErrorState message={error || "Something went wrong."} onRetry={reload} />;
  }

  const primary = primaryPortalLicense(data.licenses);
  const billingCycle = String(
    primary?.billing_cycle || data.subscriptions?.[0]?.billing_cycle || "—"
  );
  const renewal =
    data.subscription?.renewalDate ||
    data.billing?.nextInvoice ||
    primary?.expiry_date ||
    null;
  const moduleCount = primary?.modules?.length || data.modules.length;
  const packCount = primary?.feature_packs?.length || data.featurePacks.length;
  const limits = primary?.tenant_limits || {};

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
      hint: "Subscription · invoices · payments",
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
                <p className="text-sm font-semibold text-black">{data.accessNotice.title}</p>
                <PortalStatusBadge status={data.accessNotice.status} />
              </div>
              <p className="text-sm text-black">{data.accessNotice.message}</p>
            </div>
            {data.accessNotice.actionHref ? (
              <Button asChild size="sm" className="rounded-xl">
                <Link
                  href={
                    /\/portal\/plans/i.test(data.accessNotice.actionHref)
                      ? "/portal/billing"
                      : data.accessNotice.actionHref
                  }
                >
                  {data.accessNotice.actionLabel || "Continue"}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard
          label="License status"
          value={String(primary?.effective_status || primary?.status || "—")}
          icon={KeyRound}
          href="/portal/licenses"
        />
        <PortalStatCard
          label="Billing cycle"
          value={titleCaseCode(billingCycle)}
          icon={CreditCard}
          href="/portal/billing"
        />
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
                    { label: "Renewal / expiry", value: formatPortalDate(renewal) },
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
                  billingCycleFallback={data.subscriptions?.[0]?.billing_cycle}
                />
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" className="rounded-xl">
                    <Link href="/portal/billing">Renew</Link>
                  </Button>
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
          <PortalPanel title="Limits snapshot" description="Current entitlement caps on this package.">
            <div className="space-y-3">
              {[
                { label: "Users", value: limits.users },
                { label: "Companies", value: limits.companies },
                { label: "Branches", value: limits.branches },
                { label: "Warehouses", value: limits.warehouses },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3.5 py-3"
                >
                  <span className="text-sm text-[var(--portal-muted)]">{row.label}</span>
                  <span className="text-sm font-semibold">
                    {row.value == null ? "—" : String(row.value)}
                  </span>
                </div>
              ))}
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
    </div>
  );
}

/** Dedicated Custom ERP portal sections (modules / packs / limits / modify / support). */
export function PortalCustomErpSectionView({ section }: { section: CustomErpSectionKey }) {
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={2} />;
  if (error || !data) {
    return <PortalErrorState message={error || "Something went wrong."} onRetry={reload} />;
  }

  const primary = primaryPortalLicense(data.licenses);
  const modules = primary?.modules?.length ? primary.modules : data.modules;
  const packs = primary?.feature_packs?.length
    ? primary.feature_packs
    : data.featurePacks;
  const limits = primary?.tenant_limits || {};
  const sub = data.subscriptions?.[0] || null;

  if (section === "modules") {
    return (
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow="Custom ERP"
          title="Modules"
          description="Installed modules on your Custom ERP package. Add or remove modules to change entitlements — never through predefined plans."
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <PortalPanel title="Installed / enabled modules" description="Active on your license.">
            {modules.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {modules.map((m) => (
                  <li
                    key={m}
                    className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3.5 py-3 text-sm font-medium"
                  >
                    {titleCaseCode(m)}
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
          <PortalPanel
            title="Add / remove modules"
            description="Commercial changes go through Custom ERP configuration and License Engine quotes."
          >
            <div className="space-y-3 text-sm text-[var(--portal-muted)]">
              <p>
                To add modules, preview pricing, or request a license update, open Modify ERP
                Configuration. Removals and adds update your Custom ERP package — they do not switch
                you to Starter, Business, or Enterprise.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="rounded-xl">
                  <Link href="/portal/custom-erp">Add modules · quote preview</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href="/build-your-own-erp">Open Custom ERP Builder</Link>
                </Button>
              </div>
              <p className="text-xs">
                Module pricing and history are confirmed on the License Engine quote before any
                license update.
              </p>
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
          description="Active feature packs on your Custom ERP package."
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <PortalPanel title="Active feature packs" description="Currently entitled packs.">
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
          <PortalPanel
            title="Add / remove feature packs"
            description="Pack changes use Custom ERP quotes — not predefined plan cards."
          >
            <div className="space-y-3 text-sm text-[var(--portal-muted)]">
              <p>
                Available packs and pack pricing are reviewed in Modify ERP Configuration / the
                Custom ERP Builder, then confirmed with License Engine before the license updates.
              </p>
              <Button asChild size="sm" className="rounded-xl">
                <Link href="/portal/custom-erp">Manage feature packs</Link>
              </Button>
            </div>
          </PortalPanel>
        </div>
      </div>
    );
  }

  if (section === "limits") {
    const rows = [
      { label: "Users", value: limits.users },
      { label: "Companies", value: limits.companies },
      { label: "Branches", value: limits.branches },
      { label: "Warehouses", value: limits.warehouses },
      { label: "Storage", value: null as number | null },
      { label: "API", value: null as number | null },
    ];
    return (
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow="Custom ERP"
          title="Limits"
          description="Tenant limits for your Custom ERP package. Increase limits through configuration quotes — not plan upgrades."
        />
        <PortalPanel title="Current limits" description="Entitlement caps from your active license.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                  {row.label}
                </p>
                <p className="mt-2 text-xl font-semibold tracking-tight">
                  {row.value == null ? "—" : String(row.value)}
                </p>
                <p className="mt-1 text-xs text-[var(--portal-muted)]">Current entitlement</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-xl">
              <Link href="/portal/custom-erp">Request limit change</Link>
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

  // custom-erp (modify / quote / confirm)
  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Custom ERP"
        title="Modify ERP Configuration"
        description="Preview pricing changes for modules, feature packs, and limits — then confirm a license update. Predefined plans are not offered on this journey."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <PortalPanel
          title="Configuration & quote preview"
          description="Continue in the Custom ERP Builder with live License Engine pricing."
        >
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--portal-muted)]">
            <li>Review installed modules and feature packs.</li>
            <li>Adjust modules, packs, or tenant limits in the builder.</li>
            <li>Request a quote preview and review pricing changes.</li>
            <li>Confirm the upgrade — License Engine updates your custom package.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-xl">
              <Link href="/build-your-own-erp">
                Open Custom ERP Builder
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link href="/portal/billing">Review billing</Link>
            </Button>
          </div>
        </PortalPanel>
        <PortalPanel title="Current subscription" description="Billing signals for this custom package.">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3 border-b border-[var(--portal-border)] py-2">
              <span className="text-[var(--portal-muted)]">Package</span>
              <span className="font-medium">Custom ERP</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--portal-border)] py-2">
              <span className="text-[var(--portal-muted)]">Status</span>
              <span className="font-medium">
                {sub?.status || primary?.effective_status || primary?.status || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--portal-border)] py-2">
              <span className="text-[var(--portal-muted)]">Billing cycle</span>
              <span className="font-medium">
                {titleCaseCode(String(primary?.billing_cycle || sub?.billing_cycle || "—"))}
              </span>
            </div>
            <div className="flex justify-between gap-3 py-2">
              <span className="text-[var(--portal-muted)]">Next renewal</span>
              <span className="font-medium">
                {formatPortalDate(
                  data.subscription?.renewalDate ||
                    data.billing?.nextInvoice ||
                    primary?.expiry_date
                )}
              </span>
            </div>
          </div>
        </PortalPanel>
      </div>
    </div>
  );
}
