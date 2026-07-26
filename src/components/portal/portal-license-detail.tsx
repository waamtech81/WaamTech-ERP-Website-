import type { PortalLicense } from "@/lib/portal/dashboard";

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

function tenantLimitRows(lic: PortalLicense): Array<{ label: string; value: string }> {
  const limits = lic.tenant_limits;
  if (!limits) return [];
  const rows: Array<{ label: string; value: string }> = [];
  if (limits.users != null) rows.push({ label: "Users", value: String(limits.users) });
  if (limits.companies != null)
    rows.push({ label: "Companies", value: String(limits.companies) });
  if (limits.branches != null)
    rows.push({ label: "Branches", value: String(limits.branches) });
  if (limits.warehouses != null)
    rows.push({ label: "Warehouses", value: String(limits.warehouses) });
  return rows;
}

/** Engine-backed package breakdown for a license card (omit empty sections). */
export function PortalLicenseEntitlements({
  license: lic,
  industry,
  category,
  billingCycleFallback,
}: {
  license: PortalLicense;
  industry?: string | null;
  category?: string | null;
  billingCycleFallback?: string | null;
}) {
  const pkg = packageLabel(lic);
  const cycle = formatCycle(lic.billing_cycle || billingCycleFallback);
  const tenantRows = tenantLimitRows(lic);
  const meta = [
    pkg ? { label: "Package", value: pkg } : null,
    cycle ? { label: "Billing cycle", value: cycle } : null,
    industry ? { label: "Industry", value: industry } : null,
    category ? { label: "Category", value: category } : null,
  ].filter((r): r is { label: string; value: string } => Boolean(r));

  const hasModules = lic.modules.length > 0;
  const hasPacks = lic.feature_packs.length > 0;
  const hasTenant = tenantRows.length > 0;

  if (!meta.length && !hasModules && !hasPacks && !hasTenant) return null;

  return (
    <div className="mt-4 space-y-4 border-t border-[var(--portal-border)] pt-4">
      {meta.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((r) => (
            <div key={r.label}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                {r.label}
              </p>
              <p className="mt-1 text-sm font-medium">{r.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {hasModules ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
            Modules ({lic.modules.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lic.modules.map((m) => (
              <span
                key={m}
                className="rounded-full border border-[var(--portal-border)] bg-[var(--portal-soft)] px-2.5 py-1 text-[11px] font-medium"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {hasPacks ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
            Feature packs
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
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
            Tenant limits
          </p>
          <div className="grid gap-2 sm:grid-cols-4">
            {tenantRows.map((r) => (
              <div
                key={r.label}
                className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3 py-2"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                  {r.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
