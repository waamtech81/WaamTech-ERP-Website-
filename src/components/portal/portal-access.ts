import type { PortalDashboard } from "@/lib/portal/dashboard";
import {
  portalNavForJourney,
  type PortalNavItem,
} from "@/components/portal/portal-nav";
import { isCustomErpPackageType } from "@/lib/portal/package-type";

/**
 * Resolves which portal pages a customer may see.
 * Journey SSOT = commercial snapshot package_type / package_mode (via commercialJourney).
 */
export function getAccessibleNav(data: PortalDashboard | null): PortalNavItem[] {
  const snap = data?.commercialSnapshot;
  const journey =
    data?.commercialJourney === "custom" ||
    isCustomErpPackageType(snap?.package_type) ||
    isCustomErpPackageType(snap?.package_mode)
      ? "custom"
      : data?.commercialJourney || "predefined";
  const baseNav = portalNavForJourney(journey);

  if (!data) {
    return baseNav.filter(
      (item) => item.href === "/portal" || item.href === "/portal/settings"
    );
  }

  const erp = (data.erp || {}) as Record<string, unknown>;
  const raw =
    erp.portal_permissions ||
    erp.portal_pages ||
    erp.allowed_pages ||
    erp.permissions;

  const allowed = normalizePermissionList(raw);
  if (!allowed) return baseNav;

  return baseNav.filter((item) => {
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
