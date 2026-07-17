export type TrustBadgeId =
  | "enterprise-security"
  | "secure-authentication"
  | "otp-protected"
  | "role-based-access"
  | "multi-tenant"
  | "encrypted-connection"
  | "cloud-infrastructure"
  | "activity-audit"
  | "automatic-backups"
  | "secure-portal"
  | "license-protected"
  | "high-performance"
  | "automatic-updates"
  | "reliable-platform"
  | "global-ready"
  | "privacy-focused";

export type TrustBadgeMeta = {
  id: TrustBadgeId;
  label: string;
  shortLabel: string;
  description: string;
};

/** Original WaamTech trust feature badges — not third-party certifications. */
export const trustBadges: TrustBadgeMeta[] = [
  {
    id: "enterprise-security",
    label: "Enterprise Security",
    shortLabel: "Enterprise Security",
    description: "Layered platform controls that protect workspaces, users, and business data.",
  },
  {
    id: "secure-authentication",
    label: "Secure Authentication",
    shortLabel: "Secure Auth",
    description: "Strong sign-in flows so only authorized people access your WAAMTO account.",
  },
  {
    id: "otp-protected",
    label: "OTP Protected",
    shortLabel: "OTP Protected",
    description: "One-time passcodes add verification for sensitive account actions.",
  },
  {
    id: "role-based-access",
    label: "Role-Based Access",
    shortLabel: "RBAC",
    description: "Grant precise permissions by role so teams only see what they need.",
  },
  {
    id: "multi-tenant",
    label: "Multi-Tenant Platform",
    shortLabel: "Multi-Tenant",
    description: "Each business workspace is isolated from other organizations.",
  },
  {
    id: "encrypted-connection",
    label: "Encrypted Connection",
    shortLabel: "Encrypted",
    description: "HTTPS/TLS encryption protects data in transit to and from the platform.",
  },
  {
    id: "cloud-infrastructure",
    label: "Cloud Infrastructure",
    shortLabel: "Cloud Ready",
    description: "Modern cloud architecture designed for secure SaaS delivery.",
  },
  {
    id: "activity-audit",
    label: "Activity Audit Logs",
    shortLabel: "Audit Logs",
    description: "Track important actions across your workspace for accountability.",
  },
  {
    id: "automatic-backups",
    label: "Automatic Backups",
    shortLabel: "Auto Backups",
    description: "Regular backups help protect continuity and recovery readiness.",
  },
  {
    id: "secure-portal",
    label: "Secure Customer Portal",
    shortLabel: "Secure Portal",
    description: "Manage billing, licenses, and account settings in a protected portal.",
  },
  {
    id: "license-protected",
    label: "License Protected",
    shortLabel: "License Protected",
    description: "License and subscription status stay aligned with your entitlements.",
  },
  {
    id: "high-performance",
    label: "High Performance",
    shortLabel: "High Performance",
    description: "Responsive SaaS infrastructure built for everyday business operations.",
  },
  {
    id: "automatic-updates",
    label: "Automatic Updates",
    shortLabel: "Auto Updates",
    description: "Security and product improvements ship continuously to your workspace.",
  },
  {
    id: "reliable-platform",
    label: "Reliable Platform",
    shortLabel: "Reliable",
    description: "Architecture choices prioritize uptime and operational dependability.",
  },
  {
    id: "global-ready",
    label: "Global Ready",
    shortLabel: "Global Ready",
    description: "Built for teams and businesses operating across regions and time zones.",
  },
  {
    id: "privacy-focused",
    label: "Privacy Focused",
    shortLabel: "Privacy Focused",
    description: "Least-privilege access and clear data boundaries by design.",
  },
];

export const trustBadgeMap = Object.fromEntries(
  trustBadges.map((b) => [b.id, b])
) as Record<TrustBadgeId, TrustBadgeMeta>;

/** Compact sets for strips on marketing & portal surfaces */
export const trustBadgeSets = {
  all: trustBadges.map((b) => b.id),
  featured: [
    "enterprise-security",
    "secure-authentication",
    "encrypted-connection",
    "multi-tenant",
    "role-based-access",
    "privacy-focused",
  ] as TrustBadgeId[],
  pricing: [
    "enterprise-security",
    "encrypted-connection",
    "license-protected",
    "automatic-backups",
    "cloud-infrastructure",
    "reliable-platform",
  ] as TrustBadgeId[],
  portal: [
    "secure-portal",
    "license-protected",
    "otp-protected",
    "encrypted-connection",
    "activity-audit",
    "secure-authentication",
  ] as TrustBadgeId[],
  footer: [
    "enterprise-security",
    "encrypted-connection",
    "multi-tenant",
    "privacy-focused",
    "license-protected",
    "cloud-infrastructure",
  ] as TrustBadgeId[],
  about: [
    "enterprise-security",
    "role-based-access",
    "multi-tenant",
    "cloud-infrastructure",
    "activity-audit",
    "reliable-platform",
    "global-ready",
    "privacy-focused",
  ] as TrustBadgeId[],
} as const;
