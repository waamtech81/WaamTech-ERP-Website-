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
  fetchBillingCompany,
  fetchBillingDashboard,
  fetchBillingGateways,
  fetchBillingUsage,
  fetchMyInvoices,
  fetchMyPayments,
  fetchMyRenewals,
  fetchMySubscriptions,
  portalInvoiceDocumentPath,
  portalInvoicePdfPath,
} from "@/lib/commercial/client";
import {
  type PortalCustomerNotification,
} from "@/lib/portal/support";
import {
  evaluatePortalLicenseAccess,
  type PortalAccessNotice,
} from "@/lib/portal/license-access";
import type {
  CommercialInvoice,
  CommercialPayment,
  CommercialRenewal,
  CommercialSubscription,
} from "@/lib/commercial/types";

export type PortalBusinessCard = {
  businessName: string;
  industry: string | null;
  category: string | null;
  businessProfile: string | null;
  product: string | null;
  plan: string | null;
  featurePacks: string[];
  workspace: string | null;
  licenseStatus: string | null;
  subscriptionStatus: string | null;
  activationDate: string | null;
  renewalDate: string | null;
  expiryDate: string | null;
  licenseId: string | null;
  subscriptionId: string | null;
};

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

export type PortalWorkspaceUser = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  photo_url: string | null;
  status: string | null;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string | null;
  source: string | null;
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
  businesses: PortalBusinessCard[];
  workspaceUsers: PortalWorkspaceUser[];
  supportTickets: unknown[] | null;
  supportCounts: {
    open: number;
    pending: number;
    waiting_customer: number;
    resolved: number;
    closed: number;
  } | null;
  gateways: Array<{ id: string; label: string; configured: boolean; online: boolean }>;
  company: Record<string, unknown> | null;
  engineDashboard: Record<string, unknown> | null;
  unreadNotifications: number;
  /** Suspended / non-active license notice — still allows portal with clear status. */
  accessNotice?: PortalAccessNotice | null;
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
  documentUrl: string | null;
  amountDue?: number | string | null;
  amountPaid?: number | string | null;
  currency?: string | null;
  total?: number | string | null;
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

function extractFeaturePackNames(source: unknown): string[] {
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        return String(row.name || row.label || row.code || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function mapWorkspaceUsers(
  usage: {
    users?: unknown[];
    identities?: unknown[];
  } | null
): PortalWorkspaceUser[] {
  const rows = Array.isArray(usage?.users)
    ? usage!.users!
    : Array.isArray(usage?.identities)
      ? usage!.identities!
      : [];
  const mapped: PortalWorkspaceUser[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row.id || "").trim();
    if (!id) continue;
    mapped.push({
      id,
      email: row.email != null ? String(row.email) : null,
      username: row.username != null ? String(row.username) : null,
      full_name: row.full_name != null ? String(row.full_name) : null,
      phone: row.phone != null ? String(row.phone) : null,
      photo_url: row.photo_url != null ? String(row.photo_url) : null,
      status: row.status != null ? String(row.status) : null,
      email_verified_at:
        row.email_verified_at != null ? String(row.email_verified_at) : null,
      last_login_at: row.last_login_at != null ? String(row.last_login_at) : null,
      created_at: row.created_at != null ? String(row.created_at) : null,
      source: row.source != null ? String(row.source) : "license_engine",
    });
  }
  return mapped;
}

function resolveCompanyNames(
  company: Record<string, unknown> | null,
  customer: CustomerProfile | null
) {
  return {
    businessName:
      String(
        company?.company_name ||
          company?.business_name ||
          customer?.company_name ||
          customer?.workspace_name ||
          ""
      ).trim() || "Workspace",
    workspace:
      customer?.workspace_name ||
      customer?.company_name ||
      String(company?.workspace_name || company?.company_name || "").trim() ||
      null,
    industry:
      String(
        company?.industry_name || customer?.industry_name || ""
      ).trim() || null,
    category:
      String(
        company?.business_category_name || customer?.business_category_name || ""
      ).trim() || null,
    businessProfile:
      String(
        company?.business_profile_name || customer?.business_profile_name || ""
      ).trim() || null,
  };
}

function buildBusinessCards(
  rawLicenses: IdentityLicense[],
  commercialSubs: CommercialSubscription[],
  company: Record<string, unknown> | null,
  customer: CustomerProfile | null,
  featurePacks: string[]
): PortalBusinessCard[] {
  const names = resolveCompanyNames(company, customer);

  if (commercialSubs.length > 0) {
    return commercialSubs.map((sub) => {
      const lic =
        rawLicenses.find((l) => l.id === sub.license_id) ||
        rawLicenses.find(
          (l) =>
            sub.product_name &&
            l.product_name &&
            l.product_name === sub.product_name
        );
      return {
        businessName: sub.company_name || names.businessName,
        industry: names.industry,
        category: names.category,
        businessProfile: names.businessProfile,
        product: sub.product_name || lic?.product_name || null,
        plan: sub.plan_name || lic?.plan_name || null,
        featurePacks,
        workspace: names.workspace,
        licenseStatus: lic?.effective_status || lic?.status || null,
        subscriptionStatus: sub.status || null,
        activationDate: lic?.activation_date || sub.start_date || null,
        renewalDate: sub.renewal_date || null,
        expiryDate: sub.expiry_date || lic?.expiry_date || null,
        licenseId: sub.license_id || lic?.id || null,
        subscriptionId: sub.id || null,
      };
    });
  }

  if (!rawLicenses.length) {
    return [
      {
        businessName: names.businessName,
        industry: names.industry,
        category: names.category,
        businessProfile: names.businessProfile,
        product: customer?.product_name || null,
        plan: customer?.preferred_plan_name || customer?.preferred_plan || null,
        featurePacks,
        workspace: names.workspace,
        licenseStatus: null,
        subscriptionStatus: null,
        activationDate: null,
        renewalDate: null,
        expiryDate: null,
        licenseId: null,
        subscriptionId: null,
      },
    ];
  }

  return rawLicenses.map((lic) => ({
    businessName: names.businessName,
    industry: names.industry,
    category: names.category,
    businessProfile: names.businessProfile,
    product: lic.product_name || null,
    plan: lic.plan_name || null,
    featurePacks,
    workspace: names.workspace,
    licenseStatus: lic.effective_status || lic.status || null,
    subscriptionStatus: null,
    activationDate: lic.activation_date || null,
    renewalDate: lic.expiry_date || null,
    expiryDate: lic.expiry_date || null,
    licenseId: lic.id,
    subscriptionId: null,
  }));
}

function mapEngineNotifications(
  items: PortalCustomerNotification[]
): PortalNotification[] {
  return items.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body ?? null,
    category: row.category || "system",
    read: Boolean(row.is_read),
    created_at: row.created_at,
  }));
}

function toPortalInvoice(inv: CommercialInvoice, index: number): PortalInvoice {
  const id = inv.id || String(index);
  const status = String(inv.status || "").toLowerCase();
  const isPaid =
    status === "paid" ||
    (typeof inv.amount_due === "number" && inv.amount_due <= 0 && Number(inv.amount_paid || 0) > 0);
  return {
    id,
    number: inv.invoice_number || inv.id || `INV-${index + 1}`,
    status: inv.status || null,
    paymentStatus: isPaid ? "paid" : inv.status || null,
    date: inv.issue_date || null,
    dueDate: inv.due_date || null,
    amount:
      inv.total != null
        ? `${inv.currency || "USD"} ${Number(inv.total).toFixed(2)}`
        : inv.amount_due != null
          ? `${inv.currency || "USD"} ${Number(inv.amount_due).toFixed(2)}`
          : null,
    /** PDF download only after License Engine confirms payment. */
    pdfUrl: isPaid ? portalInvoicePdfPath(id) : null,
    documentUrl: portalInvoiceDocumentPath(id),
    amountDue: inv.amount_due ?? null,
    amountPaid: inv.amount_paid ?? null,
    currency: inv.currency ?? null,
    total: inv.total ?? null,
  };
}

function buildActivities(
  payments: CommercialPayment[],
  renewals: CommercialRenewal[],
  invoices: CommercialInvoice[]
): Array<{ id: string; title: string; created_at?: string }> {
  const items: Array<{
    id: string;
    title: string;
    created_at?: string;
    ts: number;
  }> = [];

  for (const payment of payments) {
    const created_at = payment.paid_date || undefined;
    items.push({
      id: `payment-${payment.id}`,
      title: `Payment ${payment.status}${payment.invoice_number ? ` · ${payment.invoice_number}` : ""}${
        payment.amount != null
          ? ` · ${payment.currency || "USD"} ${Number(payment.amount).toFixed(2)}`
          : ""
      }`,
      created_at,
      ts: created_at ? Date.parse(created_at) || 0 : 0,
    });
  }

  for (const renewal of renewals) {
    const created_at = renewal.renewal_date || undefined;
    items.push({
      id: `renewal-${renewal.id}`,
      title: `Renewal ${renewal.status || "recorded"}${
        renewal.new_expiry ? ` · expires ${renewal.new_expiry}` : ""
      }`,
      created_at,
      ts: created_at ? Date.parse(created_at) || 0 : 0,
    });
  }

  for (const invoice of invoices) {
    const created_at = invoice.issue_date || invoice.paid_date || undefined;
    items.push({
      id: `invoice-${invoice.id}`,
      title: `Invoice ${invoice.invoice_number || invoice.id} · ${invoice.status}`,
      created_at,
      ts: created_at ? Date.parse(created_at) || 0 : 0,
    });
  }

  return items
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 25)
    .map(({ id, title, created_at }) => ({ id, title, created_at }));
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

const DASHBOARD_CACHE_MS = 25_000;
const dashboardCache = new Map<string, { expires: number; data: PortalDashboard }>();

export async function loadPortalDashboard(
  accessToken: string,
  refreshToken?: string | null
): Promise<{
  ok: boolean;
  status: number;
  message: string;
  code?: string;
  data?: PortalDashboard;
  refreshed?: { accessToken: string; refreshToken: string };
}> {
  try {
    const cacheKey = `${String(accessToken || "").slice(0, 24)}:${String(refreshToken || "").slice(0, 12)}`;
    const cached = dashboardCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return {
        ok: true,
        status: 200,
        message: "OK",
        data: cached.data,
      };
    }

    const result = await loadPortalDashboardUncached(accessToken, refreshToken);
    if (result.ok && result.data && !result.refreshed) {
      dashboardCache.set(cacheKey, {
        expires: Date.now() + DASHBOARD_CACHE_MS,
        data: result.data,
      });
    } else if (result.ok && result.data && result.refreshed) {
      const refreshedKey = `${result.refreshed.accessToken.slice(0, 24)}:${result.refreshed.refreshToken.slice(0, 12)}`;
      dashboardCache.set(refreshedKey, {
        expires: Date.now() + DASHBOARD_CACHE_MS,
        data: result.data,
      });
    }
    return result;
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load portal dashboard. Please try again.",
    };
  }
}

async function loadPortalDashboardUncached(
  accessToken: string,
  refreshToken?: string | null
): Promise<{
  ok: boolean;
  status: number;
  message: string;
  code?: string;
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
    const status = me.status || 401;
    // Engine may return 403/404 when the identity was deleted after login.
    if (status === 403 || status === 404 || status === 410) {
      return {
        ok: false,
        status: 403,
        code: "ACCOUNT_DELETED",
        message:
          me.message ||
          "This account is no longer available in the license system.",
        refreshed,
      };
    }
    return {
      ok: false,
      status: status === 401 ? 401 : status,
      message: me.message || "Session expired. Please sign in again.",
      refreshed,
    };
  }

  // Two waves instead of one 12-way fan-out — cuts License Engine rate-limit spikes.
  const [licensesRes, sessionsRes, subsRes, companyRes, gatewaysRes, usageRes] =
    await Promise.all([
      identityListLicenses(token),
      identityListSessions(token),
      fetchMySubscriptions(token, { limit: 50 }),
      fetchBillingCompany(token),
      fetchBillingGateways(token),
      fetchBillingUsage(token),
    ]);

  const [invoicesRes, paymentsRes, renewalsRes, engineDashboardRes] =
    await Promise.all([
      fetchMyInvoices(token, { limit: 50 }),
      fetchMyPayments(token, { limit: 50 }),
      fetchMyRenewals(token),
      fetchBillingDashboard(token),
    ]);

  // Notifications loaded via /api/portal/notifications — skip here to avoid Engine
  // migration 500s burning the public billing rate limit on every dashboard refresh.
  const notificationsRes = {
    ok: true as const,
    data: [] as PortalCustomerNotification[],
    unread_count: 0,
  };

  const identity = me.data.identity;
  const customer = me.data.customer;
  const rawLicenses = Array.isArray(licensesRes.data) ? licensesRes.data : [];

  const licenseAccess = evaluatePortalLicenseAccess({
    identity,
    customer,
    licenses: rawLicenses,
  });
  if (!licenseAccess.ok) {
    return {
      ok: false,
      status: licenseAccess.status,
      code: licenseAccess.code,
      message: licenseAccess.message,
      refreshed,
    };
  }

  const licenses = rawLicenses.map(toPortalLicense);
  const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
  const primary = primaryLicense(rawLicenses);
  const trial = trialFromLicenses(rawLicenses);
  const erp = sanitizeErpPayload(await tryFetchErpStats(identity.email));

  const company = companyRes.ok ? companyRes.data : null;
  const engineDashboard = engineDashboardRes.ok ? engineDashboardRes.data : null;
  const gateways = gatewaysRes.ok ? gatewaysRes.data : [];
  const supportTickets = null;
  const supportCounts = null;
  const companyNames = resolveCompanyNames(company, customer);
  const workspaceUsers = mapWorkspaceUsers(usageRes.ok ? usageRes.data : null);

  const modules = Array.from(
    new Set(
      rawLicenses
        .map((l) => l.product_name)
        .filter((v): v is string => Boolean(v && String(v).trim()))
    )
  );

  const overview = {
    customerName: String(
      identity.full_name || customer?.owner_name || identity.username || "Customer"
    ),
    company: String(
      customer?.workspace_name ||
        customer?.company_name ||
        identity.username ||
        "Workspace"
    ),
    primaryEmail: String(identity.email || customer?.email || ""),
    country: customer?.country || null,
    status: customer?.status || identity.status || null,
    customerSince: customer?.created_at || null,
    lastLogin: identity.last_login_at || null,
    industry:
      companyNames.industry ||
      (customer?.industry_id ? String(customer.industry_id) : null),
    businessCategory:
      companyNames.category ||
      (customer?.business_category_id
        ? String(customer.business_category_id)
        : null),
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
          : workspaceUsers.length || null,
    registeredUsers:
      workspaceUsers.length ||
      (typeof erpCounts.registered_users === "number"
        ? erpCounts.registered_users
        : typeof erpCounts.users === "number"
          ? (erpCounts.users as number)
          : null),
    registeredBusinesses:
      typeof erpCounts.businesses === "number"
        ? erpCounts.businesses
        : typeof erpCounts.companies === "number"
          ? (erpCounts.companies as number)
          : null,
    openTickets: null,
    pendingTickets: null,
    closedTickets: null,
  };

  const commercialSubs = subsRes.ok ? subsRes.data.data : [];
  const commercialInvoices = invoicesRes.ok ? invoicesRes.data.data : [];
  const commercialPayments = paymentsRes.ok ? paymentsRes.data.data : [];
  const commercialRenewals = renewalsRes.ok ? renewalsRes.data : [];

  const commercialBillingOk =
    subsRes.ok || invoicesRes.ok || paymentsRes.ok || renewalsRes.ok;
  const commercialBillingMessage = !commercialBillingOk
    ? subsRes.message ||
      invoicesRes.message ||
      paymentsRes.message ||
      renewalsRes.message ||
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

  const invoicesFromCommercial: PortalInvoice[] = commercialInvoices.map(toPortalInvoice);

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

  const engineNotificationRows =
    notificationsRes.ok && Array.isArray(notificationsRes.data)
      ? notificationsRes.data
      : [];
  const notifications =
    engineNotificationRows.length > 0
      ? mapEngineNotifications(engineNotificationRows)
      : mapNotifications(erpCounts.notifications || erpCounts.alerts);
  const unreadNotifications =
    typeof notificationsRes.unread_count === "number"
      ? notificationsRes.unread_count
      : (notifications || []).filter((n) => !n.read).length;

  const companyFeaturePacks = extractFeaturePackNames(company?.feature_packs);
  const customerFeaturePacks = extractFeaturePackNames(customer?.feature_packs);
  const erpFeaturePacks = Array.isArray(erpCounts.feature_packs)
    ? (erpCounts.feature_packs as string[])
    : Array.isArray(erpCounts.featurePacks)
      ? (erpCounts.featurePacks as string[])
      : [];
  const featurePacks =
    companyFeaturePacks.length > 0
      ? companyFeaturePacks
      : customerFeaturePacks.length > 0
        ? customerFeaturePacks
        : erpFeaturePacks;

  const businesses = buildBusinessCards(
    rawLicenses,
    commercialSubs,
    company,
    customer,
    featurePacks
  );
  const activities = buildActivities(
    commercialPayments,
    commercialRenewals,
    commercialInvoices
  );

  const erpModules = Array.isArray(erpCounts.modules)
    ? (erpCounts.modules as string[])
    : Array.isArray(erpCounts.active_modules)
      ? (erpCounts.active_modules as string[])
      : [];

  const quickActions = [
    {
      id: "renew",
      label: "Renew Subscription",
      href: "/portal/plans?intent=renew",
    },
    {
      id: "upgrade",
      label: "Upgrade Plan",
      href: "/portal/plans?intent=upgrade",
    },
    {
      id: "new_place",
      label: "Add New Place",
      href: "/portal/plans?intent=new_place",
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
      label: "View Invoices",
      href: "/portal/invoices",
    },
    {
      id: "notifications",
      label: "Notifications",
      href: "/portal/notifications",
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
      historyOk: commercialBillingOk,
      message: commercialBillingMessage,
    },
    billingHistory: {
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
    activities,
    businesses,
    workspaceUsers,
    supportTickets,
    supportCounts,
    gateways,
    company,
    engineDashboard,
    unreadNotifications,
    accessNotice: licenseAccess.notice,
  };

  return { ok: true, status: 200, message: "OK", data, refreshed };
}

function mapInvoices(raw: unknown): PortalInvoice[] | null {
  if (!Array.isArray(raw) || !raw.length) return null;
  const mapped: PortalInvoice[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;
    const number = String(row.number || row.invoice_number || row.id || "").trim();
    if (!number) return;
    const id = String(row.id || number || index);
    mapped.push({
      id,
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
        (() => {
          const status = String(row.status || row.payment_status || row.paymentStatus || "")
            .trim()
            .toLowerCase();
          const isPaid = status === "paid";
          if (!isPaid) return null;
          if (row.pdf_url != null) return String(row.pdf_url);
          if (row.pdfUrl != null) return String(row.pdfUrl);
          return portalInvoicePdfPath(id);
        })(),
      documentUrl: portalInvoiceDocumentPath(id),
      amountDue:
        row.amount_due != null
          ? (row.amount_due as number | string)
          : row.amountDue != null
            ? (row.amountDue as number | string)
            : null,
      amountPaid:
        row.amount_paid != null
          ? (row.amount_paid as number | string)
          : row.amountPaid != null
            ? (row.amountPaid as number | string)
            : null,
      currency: row.currency != null ? String(row.currency) : null,
      total: row.total != null ? (row.total as number | string) : null,
    });
  });
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
