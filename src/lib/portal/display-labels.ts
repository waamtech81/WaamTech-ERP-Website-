/**
 * End-user labels for portal — maps Engine / API values to readable copy.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paid: "Paid",
  completed: "Completed",
  success: "Successful",
  pending: "Pending",
  awaiting_confirmation: "Payment submitted — awaiting confirmation",
  awaiting_payment: "Awaiting payment",
  awaiting_review: "Under review",
  processing: "Processing",
  trial: "Trial",
  trialing: "Trial",
  grace: "Grace period",
  suspended: "Suspended",
  expired: "Expired",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  failed: "Failed",
  overdue: "Overdue",
  unpaid: "Unpaid",
  draft: "Draft",
  open: "Open",
  read: "Read",
  unread: "Unread",
  enabled: "Enabled",
  disabled: "Disabled",
  ok: "OK",
  manual: "Manual payment",
  confirmed: "Confirmed",
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Human-readable status for badges and summary rows. */
export function formatPortalStatus(status?: string | null): string {
  if (!status) return "";
  const raw = String(status).trim();
  if (!raw) return "";
  const key = normalizeKey(raw);
  if (STATUS_LABELS[key]) return STATUS_LABELS[key];
  if (UUID_RE.test(raw)) return "Record";
  return raw.replace(/_/g, " ");
}

/** Hide raw UUIDs / internal ids in tables. */
export function formatPortalReference(value?: string | null): string {
  if (!value) return "—";
  const raw = String(value).trim();
  if (!raw) return "—";
  if (UUID_RE.test(raw)) return "—";
  return raw;
}

/** Renewal row label instead of internal id. */
export function formatPortalRenewalLabel(input: {
  id?: string | null;
  renewal_date?: string | null;
}): string {
  const date = input.renewal_date ? String(input.renewal_date).slice(0, 10) : "";
  if (date) {
    try {
      const formatted = new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(date));
      return `Plan renewal · ${formatted}`;
    } catch {
      return "Plan renewal";
    }
  }
  return "Plan renewal";
}
