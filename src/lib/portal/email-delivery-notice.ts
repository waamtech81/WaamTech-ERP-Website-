/**
 * One-time portal dashboard notice after first checkout / trial signup.
 * Client-only localStorage — does not affect billing or Engine.
 */

const PENDING_KEY = "waamto_portal_email_notice_pending";
const DISMISSED_KEY = "waamto_portal_email_notice_dismissed";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Call after successful checkout or trial signup before landing on dashboard. */
export function markPortalEmailDeliveryNoticePending(): void {
  if (!canUseStorage()) return;
  try {
    if (window.localStorage.getItem(DISMISSED_KEY) === "1") return;
    window.localStorage.setItem(PENDING_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

export function shouldShowPortalEmailDeliveryNotice(): boolean {
  if (!canUseStorage()) return false;
  try {
    if (window.localStorage.getItem(DISMISSED_KEY) === "1") return false;
    return window.localStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

/** Close — never show again for this browser. */
export function dismissPortalEmailDeliveryNotice(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}
