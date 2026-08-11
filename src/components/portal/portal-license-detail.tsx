import type { PortalLicense } from "@/lib/portal/dashboard";
import {
  annotateEntitledModulesWithCapability,
  formatCapabilityLabel,
  licenseSnapshotMeta,
  resolvePortalPlanTier,
  technicalLicenseMeta,
  type PortalPlanTier,
} from "@/lib/portal/commercial-rules";
import type { PortalCommercialSnapshot } from "@/lib/portal/commercial-snapshot";
import { resolvePurchasedLimits } from "@/lib/portal/commercial-snapshot";
import { formatPortalDate } from "@/components/portal/use-portal-data";
import type { PublicCommercialRegistry } from "@/lib/commercial/types";
import { isCustomErpPackageType } from "@/lib/portal/package-type";

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
  registry = null,
  planTier = null,
  journey = "predefined",
  /** When false, hide module/pack chips (use on overview dashboards; detail pages keep full lists). */
  showEntitlementLists = true,
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
  registry?: PublicCommercialRegistry | null;
  planTier?: PortalPlanTier | null;
  journey?: "custom" | "predefined";
  showEntitlementLists?: boolean;
}) {
  const pkg = packageLabel(lic);
  const cycle = formatCycle(lic.billing_cycle || billingCycleFallback);
  const tenantRows = tenantLimitRows(lic, snapshot);
  const snapFriendly = licenseSnapshotMeta(snapshot);
  const resolvedJourney: "custom" | "predefined" =
    journey === "custom" || isCustomErpPackageType(lic.package_type)
      ? "custom"
      : "predefined";
  const resolvedTier =
    planTier ||
    resolvePortalPlanTier({
      plan_name: lic.plan_name,
      package_type: lic.package_type,
      billing_cycle: lic.billing_cycle,
    });
  const modulesWithCapability = annotateEntitledModulesWithCapability({
    modules: lic.modules,
    planTier: resolvedTier,
    journey: resolvedJourney,
    registry,
  });

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
    syncDate ? { label: "Last updated", value: syncDate } : null,
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

  const hasModules = showEntitlementLists && lic.modules.length > 0;
  const hasPacks = showEntitlementLists && lic.feature_packs.length > 0;
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
            {modulesWithCapability.map(({ label: m, capability }) => {
              const cap = formatCapabilityLabel(capability, {
                moduleCode: m,
                registry: registry ?? null,
                customErp: resolvedJourney === "custom",
              });
              return (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--portal-border)] bg-white px-2.5 py-1 text-[11px] font-medium"
                >
                  <span>{m}</span>
                  {cap ? (
                    <span
                      className={
                        cap === "Advanced"
                          ? "rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"
                          : cap === "Full" || cap === "Fully Enabled"
                            ? "rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700"
                            : "rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                      }
                    >
                      {cap}
                    </span>
                  ) : null}
                </span>
              );
            })}
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

      {technical.length && !customerFacing ? (
        <details className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)]/60 px-4 py-3">
          <summary className="cursor-pointer select-none text-sm font-medium text-[var(--portal-fg)]">
            More account details
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
