import type { CustomerProfile, IdentityLicense, IdentityProfile } from "@/lib/license/identity";

export type PortalAccessNotice = {
  level: "warning" | "danger" | "info";
  status: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
};

export type PortalLicenseAccess =
  | { ok: true; notice: PortalAccessNotice | null }
  | {
      ok: false;
      status: 403;
      code: "ACCOUNT_DELETED" | "ACCOUNT_DISABLED";
      message: string;
    };

function norm(value?: string | null): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isDeletedStatus(value?: string | null): boolean {
  const s = norm(value);
  if (!s) return false;
  return (
    s === "deleted" ||
    s === "removed" ||
    s === "terminated" ||
    s === "purged" ||
    s.includes("deleted") ||
    s.includes("removed")
  );
}

export function isDisabledStatus(value?: string | null): boolean {
  const s = norm(value);
  return s === "disabled" || s === "inactive" || s === "blocked" || s === "banned";
}

export function isSuspendedStatus(value?: string | null): boolean {
  const s = norm(value);
  return s.includes("suspend");
}

export function isUsableLicenseStatus(value?: string | null): boolean {
  const s = norm(value);
  return ["active", "trial", "trialing", "grace", "pending"].includes(s);
}

function licenseActionLabel(lic: IdentityLicense & Record<string, unknown>): string | null {
  const raw =
    lic.action ||
    lic.status_action ||
    lic.admin_action ||
    lic.lock_reason ||
    lic.status_reason ||
    lic.message ||
    null;
  const text = String(raw || "").trim();
  return text || null;
}

/**
 * Enforce portal access from identity + license state.
 * - Deleted → hard block (403) on refresh / any dashboard load
 * - Suspended / other non-active actions → allow login, surface notice
 * - Active → full portal
 */
export function evaluatePortalLicenseAccess(input: {
  identity: IdentityProfile;
  customer: CustomerProfile | null;
  licenses: IdentityLicense[];
}): PortalLicenseAccess {
  const { identity, customer, licenses } = input;

  if (isDeletedStatus(identity.status) || isDeletedStatus(customer?.status)) {
    return {
      ok: false,
      status: 403,
      code: "ACCOUNT_DELETED",
      message:
        "This account has been deleted from the license system. Portal access is no longer available.",
    };
  }

  if (isDisabledStatus(identity.status) || isDisabledStatus(customer?.status)) {
    return {
      ok: false,
      status: 403,
      code: "ACCOUNT_DISABLED",
      message:
        "This account is disabled. Contact support or your administrator to restore access.",
    };
  }

  if (licenses.length > 0) {
    const allDeleted = licenses.every((l) =>
      isDeletedStatus(l.effective_status || l.status)
    );
    if (allDeleted) {
      return {
        ok: false,
        status: 403,
        code: "ACCOUNT_DELETED",
        message:
          "Your license has been deleted. The customer portal cannot be used for this account.",
      };
    }
  }

  const primary =
    licenses.find((l) => isUsableLicenseStatus(l.effective_status || l.status)) ||
    licenses.find((l) => !isDeletedStatus(l.effective_status || l.status)) ||
    licenses[0];

  const primaryStatus = primary
    ? String(primary.effective_status || primary.status || "")
    : String(customer?.status || identity.status || "");

  if (primary && isDeletedStatus(primaryStatus) && !licenses.some((l) => isUsableLicenseStatus(l.effective_status || l.status))) {
    return {
      ok: false,
      status: 403,
      code: "ACCOUNT_DELETED",
      message:
        "Your license has been deleted. The customer portal cannot be used for this account.",
    };
  }

  if (isSuspendedStatus(identity.status) || isSuspendedStatus(customer?.status) || isSuspendedStatus(primaryStatus)) {
    const action =
      (primary && licenseActionLabel(primary as IdentityLicense & Record<string, unknown>)) ||
      null;
    return {
      ok: true,
      notice: {
        level: "warning",
        status: primaryStatus || "suspended",
        title: "License suspended",
        message:
          action ||
          "Your license is suspended. You can review billing and renew, but product access may be limited until the license is active again.",
        actionLabel: "Renew or upgrade",
        actionHref: "/portal/plans?intent=renew",
      },
    };
  }

  if (primary && !isUsableLicenseStatus(primaryStatus) && !isDeletedStatus(primaryStatus)) {
    const action =
      licenseActionLabel(primary as IdentityLicense & Record<string, unknown>) || null;
    const statusLabel = primaryStatus || "restricted";
    return {
      ok: true,
      notice: {
        level: statusLabel.includes("expir") ? "danger" : "info",
        status: statusLabel,
        title: `License ${statusLabel}`,
        message:
          action ||
          `Your license status is “${statusLabel}”. Resolve this from billing or contact support to restore full access.`,
        actionLabel: "View billing",
        actionHref: "/portal/billing",
      },
    };
  }

  return { ok: true, notice: null };
}

/** Prefer human-facing account id (username) over technical UUIDs. */
export function resolveDisplayCustomerId(input: {
  identity: IdentityProfile;
  customer: CustomerProfile | null;
}): string {
  const username = String(input.identity.username || "").trim();
  if (username && !looksLikeUuid(username)) return username;

  const company = String(
    input.customer?.workspace_name || input.customer?.company_name || ""
  ).trim();
  if (company) return company;

  const email = String(input.identity.email || input.customer?.email || "").trim();
  if (email.includes("@")) return email.split("@")[0] || email;

  return username || email || "—";
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
