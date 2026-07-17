import type { PortalDashboard } from "@/lib/portal/dashboard";
import { PORTAL_NAV, type PortalNavItem } from "@/components/portal/portal-nav";

/**
 * Resolves which portal pages a customer may see.
 * Prefer explicit entitlements from optional ERP stats when present;
 * otherwise grant the full authenticated customer-success nav.
 */
export function getAccessibleNav(data: PortalDashboard | null): PortalNavItem[] {
  if (!data) return PORTAL_NAV.filter((item) => item.href === "/portal" || item.href === "/portal/settings");

  const erp = (data.erp || {}) as Record<string, unknown>;
  const raw =
    erp.portal_permissions ||
    erp.portal_pages ||
    erp.allowed_pages ||
    erp.permissions;

  const allowed = normalizePermissionList(raw);
  if (!allowed) return PORTAL_NAV;

  return PORTAL_NAV.filter((item) => {
    const key = navPermissionKey(item.href);
    return (
      allowed.has("*") ||
      allowed.has("all") ||
      allowed.has(key) ||
      allowed.has(item.href) ||
      allowed.has(item.label.toLowerCase())
    );
  });
}

function navPermissionKey(href: string) {
  if (href === "/portal") return "dashboard";
  return href.replace("/portal/", "").replace(/\//g, "-");
}

function normalizePermissionList(raw: unknown): Set<string> | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    const values = raw
      .map((v) => String(v || "").trim().toLowerCase())
      .filter(Boolean);
    return values.length ? new Set(values) : null;
  }

  if (typeof raw === "object") {
    const entries = Object.entries(raw as Record<string, unknown>)
      .filter(([, enabled]) => enabled === true || enabled === 1 || enabled === "1")
      .map(([key]) => key.trim().toLowerCase());
    return entries.length ? new Set(entries) : null;
  }

  if (typeof raw === "string") {
    const values = raw
      .split(/[,|\s]+/)
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    return values.length ? new Set(values) : null;
  }

  return null;
}

export function maskLicenseKeyDisplay(key?: string | null) {
  if (!key) return "XXXX-XXXX-XXXX-XXXX";
  // If already masked from API, pass through
  if (key.startsWith("XXXX-XXXX-XXXX-")) return key;
  const alnum = key.trim().replace(/[^A-Za-z0-9]/g, "");
  if (alnum.length < 4) return "XXXX-XXXX-XXXX-XXXX";
  return `XXXX-XXXX-XXXX-${alnum.slice(-4).toUpperCase()}`;
}
