/**
 * Allowlisted contact-page intents for `?intent=` links.
 * Unknown / malicious values are rejected — never reflected raw into UI or email.
 */

export const CONTACT_INTENTS = {
  lifetime: {
    subject: "Lifetime license inquiry",
    label: "Lifetime license",
  },
  enterprise: {
    subject: "Enterprise plan inquiry",
    label: "Enterprise",
  },
  "own-cloud": {
    subject: "Own cloud server deployment",
    label: "Own cloud",
  },
  whitelabel: {
    subject: "Whitelabel inquiry",
    label: "Whitelabel",
  },
  "local-server": {
    subject: "Local / on-premise server setup",
    label: "Local server",
  },
  security: {
    subject: "Security & trust inquiry",
    label: "Security",
  },
  industry: {
    subject: "Industry solution inquiry",
    label: "Industry",
  },
  "mobile-app": {
    subject: "Mobile app inquiry",
    label: "Mobile app",
  },
  demo: {
    subject: "Product demo request",
    label: "Demo",
  },
} as const;

export type ContactIntentId = keyof typeof CONTACT_INTENTS;

const INTENT_IDS = new Set<string>(Object.keys(CONTACT_INTENTS));

/** Max length guard against oversized query abuse */
const MAX_INTENT_LENGTH = 32;

/**
 * Parse and validate `intent` from the URL.
 * Returns null when missing or not on the allowlist.
 */
export function parseContactIntent(
  raw: string | null | undefined
): ContactIntentId | null {
  if (raw == null) return null;

  let value = String(raw).trim().toLowerCase();
  if (!value) return null;

  // Reject encoded / injected payloads early
  if (value.length > MAX_INTENT_LENGTH) return null;
  if (value.includes("%") || value.includes("\\") || value.includes("/")) return null;
  if (!/^[a-z0-9-]+$/.test(value)) return null;
  if (!INTENT_IDS.has(value)) return null;

  return value as ContactIntentId;
}

export function contactSubjectForIntent(intent: ContactIntentId | null): string {
  if (!intent) return "";
  return CONTACT_INTENTS[intent].subject;
}
