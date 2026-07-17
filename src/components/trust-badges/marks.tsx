import { TrustSealFrame, type TrustMarkProps } from "./frame";

/** Individual WaamTech trust badge SVG seals — original artwork, not certifications. */

export function EnterpriseSecurityBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Enterprise Security" {...props}>
      <path d="M0-18 L14-12 V0 c0 10-6 16-14 20 C-6 16-14 10-14 0 V-12 Z" fill="none" />
      <path d="M-5 0 L-1 4 L6-4" fill="none" />
    </TrustSealFrame>
  );
}

export function SecureAuthenticationBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Secure Auth" {...props}>
      <rect x="-9" y="-4" width="18" height="14" rx="3" fill="none" />
      <path d="M-5-4 V-9 a5 5 0 0 1 10 0 V-4" fill="none" />
      <circle cx="0" cy="3" r="1.5" fill="currentColor" stroke="none" />
    </TrustSealFrame>
  );
}

export function OtpProtectedBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="OTP Protected" {...props}>
      <rect x="-14" y="-8" width="28" height="16" rx="4" fill="none" />
      <circle cx="-7" cy="0" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="0" cy="0" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="7" cy="0" r="1.8" fill="currentColor" stroke="none" />
      <path d="M-10 12 H10" />
    </TrustSealFrame>
  );
}

export function RoleBasedAccessBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Role-Based Access" {...props}>
      <circle cx="0" cy="-8" r="5" fill="none" />
      <path d="M-10 10 c0-6 4.5-9 10-9 s10 3 10 9" fill="none" />
      <path d="M8-14 h6 v6" fill="none" />
      <path d="M8-14 L16-6" fill="none" />
    </TrustSealFrame>
  );
}

export function MultiTenantBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Multi-Tenant" {...props}>
      <rect x="-14" y="-12" width="11" height="9" rx="2" fill="none" />
      <rect x="3" y="-12" width="11" height="9" rx="2" fill="none" />
      <rect x="-5.5" y="2" width="11" height="9" rx="2" fill="none" />
      <path d="M-3-3 V2 M3-3 V2" opacity={0.4} />
    </TrustSealFrame>
  );
}

export function EncryptedConnectionBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Encrypted" {...props}>
      <path d="M-12 0 H-4" />
      <path d="M4 0 H12" />
      <rect x="-4" y="-7" width="8" height="14" rx="2" fill="none" />
      <path d="M-1-2 h2 M-1 2 h2 M-1 6 h2" />
      <path d="M-12-4 v8 M12-4 v8" />
    </TrustSealFrame>
  );
}

export function CloudInfrastructureBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Cloud Ready" {...props}>
      <path
        d="M-6 6 H10 a6 6 0 0 0 0-12 a8 8 0 0 0-15-2 a5.5 5.5 0 0 0-1 14 Z"
        fill="none"
      />
    </TrustSealFrame>
  );
}

export function ActivityAuditBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Audit Logs" {...props}>
      <rect x="-10" y="-14" width="20" height="26" rx="3" fill="none" />
      <path d="M-5-6 H5 M-5 0 H5 M-5 6 H2" />
      <circle cx="5" cy="6" r="2.5" fill="none" />
      <path d="M5 4.5 V6 L6.2 7" />
    </TrustSealFrame>
  );
}

export function AutomaticBackupsBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Auto Backups" {...props}>
      <ellipse cx="0" cy="-8" rx="12" ry="4" fill="none" />
      <path d="M-12-8 V4 c0 2.2 5.4 4 12 4 s12-1.8 12-4 V-8" fill="none" />
      <path d="M-12-2 c0 2.2 5.4 4 12 4 s12-1.8 12-4" fill="none" />
    </TrustSealFrame>
  );
}

export function SecurePortalBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Secure Portal" {...props}>
      <rect x="-12" y="-10" width="24" height="18" rx="3" fill="none" />
      <path d="M-12-4 H12" />
      <circle cx="-6" cy="-7" r="1" fill="currentColor" stroke="none" />
      <circle cx="-2" cy="-7" r="1" fill="currentColor" stroke="none" />
      <rect x="-4" y="12" width="8" height="4" rx="1" fill="none" />
      <path d="M0 8 V12" />
    </TrustSealFrame>
  );
}

export function LicenseProtectedBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="License Protected" {...props}>
      <rect x="-12" y="-8" width="24" height="16" rx="3" fill="none" />
      <circle cx="-5" cy="0" r="3.5" fill="none" />
      <path d="M-2 0 H10 M7-3 V3" />
    </TrustSealFrame>
  );
}

export function HighPerformanceBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="High Performance" {...props}>
      <path d="M-2-14 L4 0 H-2 L2 14" fill="none" />
      <path d="M-12 4 H-6 M6 4 H12" opacity={0.45} />
    </TrustSealFrame>
  );
}

export function AutomaticUpdatesBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Auto Updates" {...props}>
      <path d="M10-4 a12 12 0 1 0 2 8" fill="none" />
      <path d="M10-4 L14 2 L7 1 Z" fill="currentColor" stroke="none" />
    </TrustSealFrame>
  );
}

export function ReliablePlatformBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Reliable" {...props}>
      <path d="M0-14 L12-8 V2 L0 14 L-12 2 V-8 Z" fill="none" />
      <path d="M-4 0 L-1 3 L5-4" fill="none" />
    </TrustSealFrame>
  );
}

export function GlobalReadyBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Global Ready" {...props}>
      <circle cx="0" cy="0" r="12" fill="none" />
      <ellipse cx="0" cy="0" rx="5" ry="12" fill="none" />
      <path d="M-12 0 H12 M-10-6 H10 M-10 6 H10" />
    </TrustSealFrame>
  );
}

export function PrivacyFocusedBadge(props: TrustMarkProps) {
  return (
    <TrustSealFrame label="Privacy Focused" {...props}>
      <path d="M0-12 L12-6 V2 c0 8-5 12-12 16 C-5 14-12 10-12 2 V-6 Z" fill="none" />
      <circle cx="0" cy="0" r="3.5" fill="none" />
      <circle cx="0" cy="0" r="1.2" fill="currentColor" stroke="none" />
    </TrustSealFrame>
  );
}
