import { getAppLoginUrl, getPortalLoginPath } from "@/lib/auth/config";

export type PasswordResetOrigin = "website" | "erp";

export function normalizePasswordResetOrigin(value?: string | null): PasswordResetOrigin {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "erp" ? "erp" : "website";
}

export function getPasswordResetLoginUrl(origin?: string | null): string {
  return normalizePasswordResetOrigin(origin) === "erp"
    ? getAppLoginUrl()
    : getPortalLoginPath({ next: "/portal" });
}
