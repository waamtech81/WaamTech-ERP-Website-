import type { PortalLicense } from "@/lib/portal/dashboard";
import {
  licenseSnapshotMeta,
  technicalLicenseMeta,
} from "@/lib/portal/commercial-rules";
import type { PortalCommercialSnapshot } from "@/lib/portal/commercial-snapshot";
import { resolvePurchasedLimits } from "@/lib/portal/commercial-snapshot";
import { formatPortalDate } from "@/components/portal/use-portal-data";

type MetaRow = { label: string; value: string };

function MetaCell({ label, value }: MetaRow) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--portal-border)] bg-white px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium capitalize leading-snug">{value}</p>
    </div>
  );
}

function formatCycle(cycle: string | null | undefined): string | null {
  if (!cycle) return null;
  const c = cycle.toLowerCase();
  if (c === "monthly") return "Monthly";
  if (c === "yearly" || c === "annual") return "Yearly";
  if (c === "lifetime") return "Lifetime";
  return cycle;
}

function packageLabel(lic: PortalLicense): string | null {
  const type = String(lic.package_type || "").toLowerCase();
  if (type === "custom") return "Custom ERP";
  if (lic.modules.length > 0 && !lic.plan_name) return "Custom ERP";
  return null;
}

function limitLabel(key: string): string {
  if (key === "users") return "User limit";
  if (key === "companies") return "Company limit";
  if (key === "branches") return "Branch limit";
  if (key === "warehouses") return "Warehouse limit";
  return key;
}

function tenantLimitRows(
  lic: PortalLicense,
  snapshot?: PortalCommercialSnapshot | null
): Array<{ label: string; value: string }> {
  const limits = resolvePurchasedLimits(snapshot, lic.tenant_limits || null);
  const rows: Array<{ label: string; value: string }> = [];
  if (limits.users != null) rows.push({ label: limitLabel("users"), value: String(limits.users) });
  if (limits.companies != null)
    rows.push({ label: limitLabel("companies"), value: String(limits.companies) });
  if (limits.branches != null)
    rows.push({ label: limitLabel("branches"), value: String(limits.branches) });
  if (limits.warehouses != null)
    rows.push({ label: limitLabel("warehouses"), value: String(limits.warehouses) });
  return rows;
}

/** Engine-backed package breakdown for a license card (customer-first default view). */
export function PortalLicenseEntitlements({
  license: lic,
  industry,
  category,
  billingCycleFallback,
  primaryMeta = [],
  customerFacing = true,
  snapshot = null,
  renewalDate = null,
  billingStatus = null,
  technicalExtra = [],
}: {
  license: PortalLicense;
  industry?: string | null;
  category?: string | null;
  billingCycleFallback?: string | null;
  /** Extra customer-facing rows (plan, status, dates) — not technical IDs. */
  primaryMeta?: MetaRow[];
  /** Prefer customer labels; keep true for business owners by default. */
  customerFacing?: boolean;
  snapshot?: PortalCommercialSnapshot | null;
  renewalDate?: string | null;
  billingStatus?: string | null;
  technicalExtra?: MetaRow[];
}) {
  const pkg = packageLabel(lic);
  const cycle = formatCycle(lic.billing_cycle || billingCycleFallback);
  const tenantRows = tenantLimitRows(lic, snapshot);
  const snapFriendly = licenseSnapshotMeta(snapshot);

  const syncDate = snapshot?.generated_at
    ? formatPortalDate(snapshot.generated_at)
    : null;

  const meta = [
    ...primaryMeta,
    pkg ? { label: customerFacing ? "Current plan" : "Package", value: pkg } : null,
    cycle ? { label: "Billing cycle", value: cycle } : null,
    renewalDate
      ? { label: "Renewal date", value: formatPortalDate(renewalDate) || String(renewalDate) }
      : null,
    billingStatus ? { label: "Billing status", value: billingStatus } : null,
    syncDate ? { label: "Last license sync", value: syncDate } : null,
    !customerFacing && industry ? { label: "Industry", value: industry } : null,
    !customerFacing && category ? { label: "Category", value: category } : null,
    ...snapFriendly.filter((r) => !pkg || r.label !== "Package"),
  ].filter((r): r is MetaRow => Boolean(r?.value && r.value !== "—"));

  const technical = [
    ...technicalLicenseMeta({
      snapshot,
      licenseId: lic.id,
      keyMasked: lic.keyMasked || null,
      planType: lic.plan_type || null,
      deploymentType: lic.deployment_type || null,
      packageMode: snapshot?.package_mode || null,
    }),
    ...technicalExtra,
  ];

  const hasModules = lic.modules.length > 0;
  const hasPacks = lic.feature_packs.length > 0;
  const hasTenant = tenantRows.length > 0;

  if (!meta.length && !hasModules && !hasPacks && !hasTenant && !technical.length) {
    return null;
  }

  return (
    <div className="mt-5 space-y-5">
      {meta.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {meta.map((r) => (
            <MetaCell key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
      ) : null}

      {hasModules ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
            Active modules
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lic.modules.map((m) => (
              <span
                key={m}
                className="rounded-full border border-[var(--portal-border)] bg-white px-2.5 py-1 text-[11px] font-medium"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {hasPacks ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
            Active feature packs
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lic.feature_packs.map((f) => (
              <span
                key={f}
                className="rounded-full bg-[var(--portal-primary-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--portal-primary)]"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {hasTenant ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
            Account limits
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tenantRows.map((r) => (
              <div
                key={r.label}
                className="min-w-0 rounded-xl border border-[var(--portal-border)] bg-white px-3.5 py-3 text-center sm:text-left"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                  {r.label}
                </p>
                <p className="mt-1.5 text-lg font-semibold tabular-nums leading-none">{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {technical.length ? (
        <details className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)]/60 px-4 py-3">
          <summary className="cursor-pointer select-none text-sm font-medium text-[var(--portal-fg)]">
            Technical details
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {technical.map((r) => (
              <div key={r.label} className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                  {r.label}
                </p>
                <p className="mt-1 break-all font-mono text-xs leading-snug text-[var(--portal-fg)]">
                  {r.value}
                </p>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
