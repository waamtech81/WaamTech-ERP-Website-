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

/** Hide raw UUIDs / internal ids in tables. Parse portal payment refs (method=…|txn=…). */
export function formatPortalReference(value?: string | null): string {
  if (!value) return "—";
  const raw = String(value).trim();
  if (!raw) return "—";
  if (UUID_RE.test(raw)) return "—";

  if (raw.includes("|") || raw.includes("=")) {
    const parsed: Record<string, string> = {};
    for (const part of raw.split("|")) {
      const eq = part.indexOf("=");
      if (eq <= 0) continue;
      const key = part.slice(0, eq).trim().toLowerCase();
      const val = part.slice(eq + 1).trim();
      if (key && val) parsed[key] = val;
    }
    const txn = parsed.txn || parsed.transaction_id || parsed.reference;
    if (txn) return txn;
  }

  return raw;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank: "Direct Bank Transfer",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
  paypal: "PayPal",
  stripe: "Debit/Credit Card",
  card: "Debit/Credit Card",
  manual: "Bank transfer / wallet",
  wise: "Wise",
};

/** Human-readable payment method for portal (not raw gateway codes). */
export function formatPortalPaymentMethod(value?: string | null): string {
  if (!value) return "—";
  const key = String(value).trim().toLowerCase();
  if (!key) return "—";
  return (
    PAYMENT_METHOD_LABELS[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

const FEATURE_PACK_LABELS: Record<string, string> = {
  CORE_OPS: "Core Operations",
  CORE_ALL_MODULES: "All Core Modules",
  BUILDER_STARTER: "Builder Starter",
  BUILDER_GROWTH: "Builder Growth",
  BUILDER_ENTERPRISE: "Builder Enterprise",
};

/** Human-readable feature pack name for portal (catalog map overrides static labels). */
export function formatFeaturePackLabel(
  code?: string | null,
  catalog?: Map<string, string> | Record<string, string>
): string {
  const raw = String(code || "").trim();
  if (!raw) return "Feature pack";
  const map =
    catalog instanceof Map
      ? catalog
      : catalog
        ? new Map(Object.entries(catalog))
        : null;
  const fromCatalog = map?.get(raw);
  if (fromCatalog) return fromCatalog;
  if (FEATURE_PACK_LABELS[raw]) return FEATURE_PACK_LABELS[raw];
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Renewal row label instead of internal id. */
export function formatPortalRenewalLabel(input: {
  id?: string | null;
  renewal_date?: string | null;
  payment_date?: string | null;
  completed_at?: string | null;
}): string {
  const date = [input.renewal_date, input.payment_date, input.completed_at]
    .map((v) => (v ? String(v).slice(0, 10) : ""))
    .find(Boolean) || "";
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
