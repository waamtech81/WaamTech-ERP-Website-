/**
 * Enterprise email layout contract for License Engine.
 *
 * The Website does not send system emails. License Engine owns delivery.
 * Keep this file as the shared content/layout checklist so Engine templates
 * stay consistent (Registration OTP, Login OTP, Welcome, Password Reset,
 * Password Changed, Trial, Renewal, Invoice, License, Notification, Support).
 *
 * Manual Engine configuration:
 * - Point password-reset links to: {WEBSITE_URL}/reset-password?token=...
 * - After reset success, send password_changed confirmation (time, date, IP, UA)
 * - Use one global HTML shell with brand colors, logo, header, CTA, footer
 */

export const ENTERPRISE_EMAIL_BRAND = {
  companyName: "WaamTech",
  productName: "WAAMTO",
  productLine: "Enterprise ERP Platform",
  primary: "#0549a4",
  brandDark: "#09215b",
  accent: "#10b981",
  supportEmail: "support@waamto.com",
  websiteUrl: "https://waamto.com",
  logoPath: "/waamto-logo.webp",
} as const;

export const SYSTEM_EMAIL_TYPES = [
  "registration_otp",
  "login_otp",
  "welcome",
  "password_reset",
  "password_changed",
  "trial_started",
  "trial_expiry",
  "subscription_renewal",
  "invoice",
  "license",
  "notification",
  "support",
] as const;

export type SystemEmailType = (typeof SYSTEM_EMAIL_TYPES)[number];

/** Required blocks inside every Engine system email */
export const ENTERPRISE_EMAIL_BLOCKS = [
  "logo",
  "company_name",
  "product_line",
  "professional_header",
  "greeting",
  "primary_message",
  "primary_cta_button",
  "fallback_url",
  "security_notice",
  "support_information",
  "company_footer",
  "website",
  "email",
  "copyright",
] as const;

export const PASSWORD_RESET_EMAIL_COPY = {
  subject: "Reset your WAAMTO password",
  headline: "Reset your password",
  body: "We received a request to reset the password for your WAAMTO enterprise identity.",
  cta: "Reset Password",
  security:
    "This link is single-use and expires automatically. If you did not request a reset, ignore this email or contact support immediately.",
} as const;

export const PASSWORD_CHANGED_EMAIL_COPY = {
  subject: "Your WAAMTO password was changed",
  headline: "Password changed successfully",
  body: "Your enterprise identity password was updated. It is now valid for Website login, Customer Portal, and WAAMTO ERP.",
  security:
    "If this was not you, contact Support immediately and secure your account.",
} as const;
