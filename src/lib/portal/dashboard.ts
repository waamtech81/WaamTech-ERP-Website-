import {
  identityListLicenses,
  identityListSessions,
  identityMe,
  identityRefresh,
  type CustomerProfile,
  type IdentityLicense,
  type IdentityProfile,
  type IdentitySession,
} from "@/lib/license/identity";
import { maskLicenseKey } from "@/lib/auth/session";
import { authConfig, normalizeApiBase } from "@/lib/auth/config";
import {
  fetchMyBillingHistory,
  fetchMyInvoices,
  fetchMyPayments,
  fetchMyRenewals,
  fetchMySubscriptions,
} from "@/lib/commercial/client";
import type {
  CommercialInvoice,
  CommercialPayment,
  CommercialRenewal,
  CommercialSubscription,
} from "@/lib/commercial/types";

export type PortalLicense = {
  id: string;
  /** Masked only — never the full Engine key */
  keyMasked: string;
  product_name?: string | null;
  product_slug?: string | null;
  plan_name?: string | null;
  plan_type?: string | null;
  plan_slug?: string | null;
  deployment_type?: string | null;
  activation_date?: string | null;
  status: string;
  effective_status?: string;
  expired?: boolean;
  in_grace?: boolean;
  days_remaining?: number | null;
  expiry_date?: string | null;
  grace_period_days?: number | null;
};

export type PortalDashboard = {
  identity: IdentityProfile;
  customer: CustomerProfile | null;
  overview: {
    customerName: string;
    company: string;
    primaryEmail: string;
    country: string | null;
    status: string | null;
    customerSince: string | null;
    lastLogin: string | null;
    industry: string | null;
    businessCategory: string | null;
  };
  subscription: {
    status: string | null;
    currentPlan: string | null;
    trialStatus: string | null;
    trialRemainingDays: number | null;
    renewalDate: string | null;
  } | null;
  license: {
    status: string | null;
    keyMasked: string | null;
    expiry: string | null;
    productName: string | null;
    count: number;
  } | null;
  licenses: PortalLicense[];
  sessions: IdentitySession[];
  billing: {
    nextInvoice: string | null;
    outstandingBalance: string | null;
  } | null;
  invoices: PortalInvoice[] | null;
  subscriptions: CommercialSubscription[];
  payments: CommercialPayment[];
  renewals: CommercialRenewal[];
  /** Distinguishes true empty billing from License Engine commercial API outage. */
  commercialBilling: {
    ok: boolean;
    subscriptionsOk: boolean;
    invoicesOk: boolean;
    paymentsOk: boolean;
    renewalsOk: boolean;
    historyOk: boolean;
    message: string | null;
  };
  billingHistory: {
    subscriptions: CommercialSubscription[];
    invoices: CommercialInvoice[];
    payments: CommercialPayment[];
    renewals: CommercialRenewal[];
  } | null;
  counts: {
    licensedUsers: number | null;
    registeredUsers: number | null;
    registeredBusinesses: number | null;
    openTickets: number | null;
    pendingTickets: number | null;
    closedTickets: number | null;
  };
  modules: string[];
  featurePacks: string[];
  quickActions: Array<{
    id: string;
    label: string;
    href: string;
    external?: boolean;
  }>;
  erp: Record<string, unknown> | null;
  notifications: PortalNotification[] | null;
  activities: Array<{ id: string; title: string; created_at?: string }> | null;
};

export type PortalInvoice = {
  id: string;
  number: string;
  status: string | null;
  paymentStatus: string | null;
  date: string | null;
  dueDate: string | null;
  amount: string | null;
  pdfUrl: string | null;
};

export type PortalNotification = {
  id: string;
  title: string;
  body?: string | null;
  category?: string | null;
  read?: boolean;
  created_at?: string;
};

function toPortalLicense(lic: IdentityLicense): PortalLicense {
  return {
    id: lic.id,
    keyMasked: maskLicenseKey(lic.license_key),
    product_name: lic.product_name,
    product_slug: lic.product_slug,
    plan_name: lic.plan_name,
    plan_type: lic.plan_type,
    plan_slug: lic.plan_slug,
    deployment_type: lic.deployment_type,
    activation_date: lic.activation_date,
    status: lic.status,
    effective_status: lic.effective_status,
    expired: lic.expired,
    in_grace: lic.in_grace,
    days_remaining: lic.days_remaining,
    expiry_date: lic.expiry_date,
    grace_period_days: lic.grace_period_days,
  };
}

/** Strip secrets / raw keys from optional ERP widget payloads before browser. */
function sanitizeErpPayload(
  erp: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!erp) return null;
  const blocked = new Set([
    "license_key",
    "licenseKey",
    "accessToken",
    "refreshToken",
    "password",
    "secret",
    "api_key",
    "apiKey",
  ]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(erp)) {
    if (blocked.has(key)) continue;
    out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

function trialFromLicenses(licenses: IdentityLicense[]) {
  const trial = licenses.find(
    (l) =>
      l.plan_type === "trial" ||
      l.status === "trial" ||
      String(l.effective_status || "").toLowerCase() === "trial"
  );
  if (!trial) {
    const anyTrialish = licenses.some((l) => l.plan_type === "trial");
    return {
      trialStatus: anyTrialish ? "trial" : licenses.length ? "not_trial" : null,
      trialRemainingDays: null as number | null,
    };
  }
  return {
    trialStatus: trial.effective_status || trial.status || "trial",
    trialRemainingDays:
      typeof trial.days_remaining === "number" ? trial.days_remaining : null,
  };
}

function primaryLicense(licenses: IdentityLicense[]) {
  if (!licenses.length) return null;
  const active = licenses.find((l) =>
    ["active", "trial", "grace", "pending"].includes(
      String(l.effective_status || l.status).toLowerCase()
    )
  );
  return active || licenses[0];
}

async function tryFetchErpStats(email: string): Promise<Record<string, unknown> | null> {
  const base = normalizeApiBase(authConfig.apiUrl);
  if (!base || base.includes("localhost") && process.env.NODE_ENV === "production") {
    // Still try in production if configured; skip only when clearly unset
  }
  try {
    const paths = [
      `/v1/public/customer-stats?email=${encodeURIComponent(email)}`,
      `/v1/portal/stats?email=${encodeURIComponent(email)}`,
    ];
    for (const path of paths) {
      const res = await fetch(`${base}${path}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        success?: boolean;
        data?: Record<string, unknown>;
      };
      if (json.success && json.data && Object.keys(json.data).length) {
        return json.data;
      }
    }
  } catch {
    /* optional ERP data */
  }
  return null;
}

export async function loadPortalDashboard(
  accessToken: string,
  refreshToken?: string | null
): Promise<{
  ok: boolean;
  status: number;
  message: string;
  data?: PortalDashboard;
  refreshed?: { accessToken: string; refreshToken: string };
}> {
  let token = accessToken;
  let refreshed: { accessToken: string; refreshToken: string } | undefined;

  let me = await identityMe(token);
  if (!me.ok && me.status === 401 && refreshToken) {
    const refreshedTokens = await identityRefresh(refreshToken);
    if (refreshedTokens.ok && refreshedTokens.data?.accessToken) {
      token = refreshedTokens.data.accessToken;
      refreshed = {
        accessToken: refreshedTokens.data.accessToken,
        refreshToken: refreshedTokens.data.refreshToken || refreshToken,
      };
      me = await identityMe(token);
    }
  }

  if (!me.ok || !me.data?.identity) {
    return {
      ok: false,
      status: me.status || 401,
      message: me.message || "Session expired. Please sign in again.",
    };
  }

  const [licensesRes, sessionsRes] = await Promise.all([
    identityListLicenses(token),
    identityListSessions(token),
  ]);

  const identity = me.data.identity;
  const customer = me.data.customer;
  const rawLicenses = Array.isArray(licensesRes.data) ? licensesRes.data : [];
  const licenses = rawLicenses.map(toPortalLicense);
  const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
  const primary = primaryLicense(rawLicenses);
  const trial = trialFromLicenses(rawLicenses);
  const erp = sanitizeErpPayload(await tryFetchErpStats(identity.email));

  const modules = Array.from(
    new Set(
      rawLicenses
        .map((l) => l.product_name)
        .filter((v): v is string => Boolean(v && String(v).trim()))
    )
  );

  const overview = {
    customerName: identity.full_name || customer?.owner_name || identity.username,
    company:
      customer?.workspace_name ||
      customer?.company_name ||
      identity.username ||
      "Workspace",
    primaryEmail: identity.email || customer?.email || "",
    country: customer?.country || null,
    status: customer?.status || identity.status || null,
    customerSince: customer?.created_at || null,
    lastLogin: identity.last_login_at || null,
    industry: customer?.industry_id || null,
    businessCategory: customer?.business_category_id || null,
  };

  const subscription =
    primary || trial.trialStatus
      ? {
          status: primary?.effective_status || primary?.status || null,
          currentPlan: primary?.plan_name || customer?.preferred_plan || null,
          trialStatus: trial.trialStatus,
          trialRemainingDays: trial.trialRemainingDays,
          renewalDate: primary?.expiry_date || null,
        }
      : null;

  const license = primary
    ? {
        status: primary.effective_status || primary.status,
        keyMasked: maskLicenseKey(primary.license_key),
        expiry: primary.expiry_date || null,
        productName: primary.product_name || null,
        count: rawLicenses.length,
      }
    : rawLicenses.length
      ? {
          status: null,
          keyMasked: null,
          expiry: null,
          productName: null,
          count: rawLicenses.length,
        }
      : null;

  const erpCounts = (erp || {}) as Record<string, unknown>;
  const counts = {
    licensedUsers:
      typeof erpCounts.licensed_users === "number"
        ? erpCounts.licensed_users
        : typeof erpCounts.licensedUsers === "number"
          ? (erpCounts.licensedUsers as number)
          : null,
    registeredUsers:
      typeof erpCounts.registered_users === "number"
        ? erpCounts.registered_users
        : typeof erpCounts.users === "number"
          ? (erpCounts.users as number)
          : null,
    registeredBusinesses:
      typeof erpCounts.businesses === "number"
        ? erpCounts.businesses
        : typeof erpCounts.companies === "number"
          ? (erpCounts.companies as number)
          : null,
    openTickets:
      typeof erpCounts.open_tickets === "number"
        ? erpCounts.open_tickets
        : typeof erpCounts.openTickets === "number"
          ? (erpCounts.openTickets as number)
          : null,
    pendingTickets:
      typeof erpCounts.pending_tickets === "number"
        ? erpCounts.pending_tickets
        : typeof erpCounts.pendingTickets === "number"
          ? (erpCounts.pendingTickets as number)
          : null,
    closedTickets:
      typeof erpCounts.closed_tickets === "number"
        ? erpCounts.closed_tickets
        : typeof erpCounts.closedTickets === "number"
          ? (erpCounts.closedTickets as number)
          : null,
  };

  const [subsRes, invoicesRes, paymentsRes, renewalsRes, historyRes] = await Promise.all([
    fetchMySubscriptions(token, { limit: 50 }),
    fetchMyInvoices(token, { limit: 50 }),
    fetchMyPayments(token, { limit: 50 }),
    fetchMyRenewals(token),
    fetchMyBillingHistory(token),
  ]);

  const commercialSubs = subsRes.ok ? subsRes.data.data : [];
  const commercialInvoices = invoicesRes.ok ? invoicesRes.data.data : [];
  const commercialPayments = paymentsRes.ok ? paymentsRes.data.data : [];
  const commercialRenewals = renewalsRes.ok ? renewalsRes.data : [];
  const history = historyRes.ok ? historyRes.data : null;

  const commercialBillingOk =
    subsRes.ok || invoicesRes.ok || paymentsRes.ok || renewalsRes.ok || historyRes.ok;
  const commercialBillingMessage = !commercialBillingOk
    ? subsRes.message ||
      invoicesRes.message ||
      paymentsRes.message ||
      renewalsRes.message ||
      historyRes.message ||
      "Billing services are temporarily unavailable."
    : null;

  const primarySub =
    commercialSubs.find((s) =>
      ["active", "trial", "grace", "pending"].includes(String(s.status).toLowerCase())
    ) || commercialSubs[0];

  const openInvoices = commercialInvoices.filter((inv) =>
    ["open", "sent", "overdue", "partial"].includes(String(inv.status).toLowerCase())
  );
  const outstanding = openInvoices.reduce((sum, inv) => {
    const due =
      typeof inv.amount_due === "number"
        ? inv.amount_due
        : typeof inv.total === "number"
          ? inv.total
          : 0;
    return sum + due;
  }, 0);

  const billingFromCommercial =
    primarySub || outstanding > 0
      ? {
          nextInvoice: primarySub?.renewal_date || primarySub?.expiry_date || null,
          outstandingBalance:
            outstanding > 0
              ? `${openInvoices[0]?.currency || primarySub?.currency || "USD"} ${outstanding.toFixed(2)}`
              : null,
        }
      : null;

  const billing =
    billingFromCommercial ||
    (erpCounts.next_invoice ||
    erpCounts.nextInvoice ||
    erpCounts.outstanding_balance ||
    erpCounts.outstandingBalance
      ? {
          nextInvoice: String(
            erpCounts.next_invoice || erpCounts.nextInvoice || ""
          ).trim() || null,
          outstandingBalance: String(
            erpCounts.outstanding_balance || erpCounts.outstandingBalance || ""
          ).trim() || null,
        }
      : null);

  const invoicesFromCommercial: PortalInvoice[] = commercialInvoices.map((inv, index) => ({
    id: inv.id || String(index),
    number: inv.invoice_number || inv.id || `INV-${index + 1}`,
    status: inv.status || null,
    paymentStatus:
      typeof inv.amount_due === "number" && inv.amount_due <= 0 ? "paid" : inv.status || null,
    date: inv.issue_date || null,
    dueDate: inv.due_date || null,
    amount:
      inv.total != null
        ? `${inv.currency || "USD"} ${Number(inv.total).toFixed(2)}`
        : inv.amount_due != null
          ? `${inv.currency || "USD"} ${Number(inv.amount_due).toFixed(2)}`
          : null,
    pdfUrl: inv.pdf_url || null,
  }));

  const invoices =
    invoicesFromCommercial.length > 0
      ? invoicesFromCommercial
      : mapInvoices(erpCounts.invoices || erpCounts.invoice_list);

  const subscriptionFromCommercial = primarySub
    ? {
        status: primarySub.status || null,
        currentPlan: primarySub.plan_name || customer?.preferred_plan || null,
        trialStatus:
          primarySub.status === "trial" || primarySub.trial_ends_at ? "trial" : trial.trialStatus,
        trialRemainingDays: trial.trialRemainingDays,
        renewalDate: primarySub.renewal_date || primarySub.expiry_date || null,
      }
    : subscription;
  const notifications = mapNotifications(
    erpCounts.notifications || erpCounts.alerts
  );

  const featurePacks = Array.isArray(erpCounts.feature_packs)
    ? (erpCounts.feature_packs as string[])
    : Array.isArray(erpCounts.featurePacks)
      ? (erpCounts.featurePacks as string[])
      : [];

  const erpModules = Array.isArray(erpCounts.modules)
    ? (erpCounts.modules as string[])
    : Array.isArray(erpCounts.active_modules)
      ? (erpCounts.active_modules as string[])
      : [];

  const quickActions = [
    {
      id: "renew",
      label: "Renew Subscription",
      href: "/portal/subscriptions",
    },
    {
      id: "users",
      label: "Manage Users",
      href: "/portal/users",
    },
    {
      id: "erp",
      label: "Open WAAMTO ERP",
      href: `${authConfig.appUrl.replace(/\/+$/, "")}/login?email=${encodeURIComponent(identity.email)}`,
      external: true,
    },
    {
      id: "billing",
      label: "View Billing",
      href: "/portal/billing",
    },
    {
      id: "licenses",
      label: "Download License",
      href: "/portal/licenses",
    },
    {
      id: "support",
      label: "Create Support Ticket",
      href: "/portal/support",
    },
    {
      id: "org",
      label: "Manage Organization",
      href: "/portal/organization",
    },
    {
      id: "profile",
      label: "Business Profile",
      href: "/portal/business-profile",
    },
    {
      id: "settings",
      label: "Account Settings",
      href: "/portal/settings",
    },
    {
      id: "invoices",
      label: "Download Invoice",
      href: "/portal/invoices",
    },
  ];

  const data: PortalDashboard = {
    identity,
    customer,
    overview,
    subscription: subscriptionFromCommercial,
    license,
    licenses,
    sessions,
    billing,
    invoices,
    subscriptions: commercialSubs,
    payments: commercialPayments,
    renewals: commercialRenewals,
    commercialBilling: {
      ok: commercialBillingOk,
      subscriptionsOk: subsRes.ok,
      invoicesOk: invoicesRes.ok,
      paymentsOk: paymentsRes.ok,
      renewalsOk: renewalsRes.ok,
      historyOk: historyRes.ok,
      message: commercialBillingMessage,
    },
    billingHistory: history
      ? {
          subscriptions: history.subscriptions || commercialSubs,
          invoices: history.invoices || commercialInvoices,
          payments: history.payments || commercialPayments,
          renewals: history.renewals || commercialRenewals,
        }
      : {
          subscriptions: commercialSubs,
          invoices: commercialInvoices,
          payments: commercialPayments,
          renewals: commercialRenewals,
        },
    counts,
    modules: [...modules, ...erpModules].filter(Boolean),
    featurePacks,
    quickActions,
    erp: erp && Object.keys(erp).length ? erp : null,
    notifications,
    activities: null,
  };

  return { ok: true, status: 200, message: "OK", data, refreshed };
}

function mapInvoices(raw: unknown): PortalInvoice[] | null {
  if (!Array.isArray(raw) || !raw.length) return null;
  const mapped = raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const number = String(row.number || row.invoice_number || row.id || "").trim();
      if (!number) return null;
      return {
        id: String(row.id || number || index),
        number,
        status: row.status != null ? String(row.status) : null,
        paymentStatus:
          row.payment_status != null
            ? String(row.payment_status)
            : row.paymentStatus != null
              ? String(row.paymentStatus)
              : null,
        date:
          row.date != null
            ? String(row.date)
            : row.issued_at != null
              ? String(row.issued_at)
              : null,
        dueDate:
          row.due_date != null
            ? String(row.due_date)
            : row.dueDate != null
              ? String(row.dueDate)
              : null,
        amount:
          row.amount != null
            ? String(row.amount)
            : row.total != null
              ? String(row.total)
              : null,
        pdfUrl:
          row.pdf_url != null
            ? String(row.pdf_url)
            : row.pdfUrl != null
              ? String(row.pdfUrl)
              : null,
      } satisfies PortalInvoice;
    })
    .filter((v): v is PortalInvoice => Boolean(v));
  return mapped.length ? mapped : null;
}

function mapNotifications(raw: unknown): PortalNotification[] | null {
  if (!Array.isArray(raw) || !raw.length) return null;
  const mapped: PortalNotification[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;
    const title = String(row.title || row.message || "").trim();
    if (!title) return;
    mapped.push({
      id: String(row.id || index),
      title,
      body:
        row.body != null
          ? String(row.body)
          : row.description != null
            ? String(row.description)
            : null,
      category:
        row.category != null
          ? String(row.category)
          : row.type != null
            ? String(row.type)
            : null,
      read: Boolean(row.read || row.is_read),
      created_at:
        row.created_at != null
          ? String(row.created_at)
          : row.createdAt != null
            ? String(row.createdAt)
            : undefined,
    });
  });
  return mapped.length ? mapped : null;
}
