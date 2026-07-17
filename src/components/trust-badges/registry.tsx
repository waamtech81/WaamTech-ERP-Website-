import type { ComponentType } from "react";
import type { TrustBadgeId } from "@/lib/data/trust-badges";
import type { TrustMarkProps } from "./frame";
import {
  ActivityAuditBadge,
  AutomaticBackupsBadge,
  AutomaticUpdatesBadge,
  CloudInfrastructureBadge,
  EncryptedConnectionBadge,
  EnterpriseSecurityBadge,
  GlobalReadyBadge,
  HighPerformanceBadge,
  LicenseProtectedBadge,
  MultiTenantBadge,
  OtpProtectedBadge,
  PrivacyFocusedBadge,
  ReliablePlatformBadge,
  RoleBasedAccessBadge,
  SecureAuthenticationBadge,
  SecurePortalBadge,
} from "./marks";

export const trustBadgeComponents: Record<
  TrustBadgeId,
  ComponentType<TrustMarkProps>
> = {
  "enterprise-security": EnterpriseSecurityBadge,
  "secure-authentication": SecureAuthenticationBadge,
  "otp-protected": OtpProtectedBadge,
  "role-based-access": RoleBasedAccessBadge,
  "multi-tenant": MultiTenantBadge,
  "encrypted-connection": EncryptedConnectionBadge,
  "cloud-infrastructure": CloudInfrastructureBadge,
  "activity-audit": ActivityAuditBadge,
  "automatic-backups": AutomaticBackupsBadge,
  "secure-portal": SecurePortalBadge,
  "license-protected": LicenseProtectedBadge,
  "high-performance": HighPerformanceBadge,
  "automatic-updates": AutomaticUpdatesBadge,
  "reliable-platform": ReliablePlatformBadge,
  "global-ready": GlobalReadyBadge,
  "privacy-focused": PrivacyFocusedBadge,
};

export {
  ActivityAuditBadge,
  AutomaticBackupsBadge,
  AutomaticUpdatesBadge,
  CloudInfrastructureBadge,
  EncryptedConnectionBadge,
  EnterpriseSecurityBadge,
  GlobalReadyBadge,
  HighPerformanceBadge,
  LicenseProtectedBadge,
  MultiTenantBadge,
  OtpProtectedBadge,
  PrivacyFocusedBadge,
  ReliablePlatformBadge,
  RoleBasedAccessBadge,
  SecureAuthenticationBadge,
  SecurePortalBadge,
};
