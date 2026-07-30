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
import { formatFeaturePackLabel } from "@/lib/portal/display-labels";
import {
  normalizePortalCommercialSnapshot,
  normalizeSnapshotLimits,
  type PortalCommercialSnapshot,
} from "@/lib/portal/commercial-snapshot";
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
  fetchPublicCommercialOverview,
  fetchPublicModules,
  portalInvoiceDocumentPath,
  portalInvoicePdfPath,
} from "@/lib/commercial/client";
import {
  fetchMyNotifications,
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
import {
  resolveJourneyFromLicenses,
  resolvePrimaryBillingCycle,
  showRenewalUi,
  type PortalCommercialJourney,
} from "@/lib/portal/package-type";

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

export type PortalLicenseTenantLimits = {
  users?: number | null;
  companies?: number | null;
  branches?: number | null;
  warehouses?: number | null;
  storage?: number | null;
  api?: number | null;
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
  package_type?: string | null;
  billing_cycle?: string | null;
  /** Display labels for UI. */
  modules: string[];
  /** Canonical License Engine module codes (upgrade / checkout SSOT). */
  module_codes: string[];
  /** Display labels for UI. */
  feature_packs: string[];
  /** Canonical License Engine feature-pack codes (upgrade / checkout SSOT). */
  feature_pack_codes: string[];
  tenant_limits?: PortalLicenseTenantLimits | null;
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
  /** Full public catalog module codes — for Custom ERP upgrade diff (not license-only). */
  catalogModuleCodes: string[];
  /** Catalog modules with prices for Custom ERP upgrade picker. */
  catalogModules: Array<{
    code: string;
    name: string;
    description?: string | null;
    monthly_price?: number | null;
    yearly_price?: number | null;
    lifetime_price?: number | null;
  }>;
  /** Catalog feature packs for upgrade picker (from Commercial Overview). */
  catalogFeaturePacks: Array<{
    code: string;
    name: string;
    description?: string | null;
    required_module_codes?: string[];
    monthly_price?: number | null;
    yearly_price?: number | null;
    lifetime_price?: number | null;
    cycle_price?: number | null;
  }>;
  /** License Engine Commercial Snapshot SSOT (from GET /public/billing/company). */
  commercialSnapshot: PortalCommercialSnapshot | null;
  /**
   * Portal rendering journey — derived from primary license package_type.
   * Does not change License Engine commercial logic.
   */
  commercialJourney: PortalCommercialJourney;
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
  /** Open Engine checkout the customer can resume (signup / invoice). */
  pendingCheckout: {
    session_token: string;
    status: string;
    purpose: string;
    amount: number;
    currency: string;
  } | null;
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

function toPortalLicense(
  lic: IdentityLicense,
  moduleLabels?: Map<string, string>,
  featurePackLabels?: Map<string, string>
): PortalLicense {
  const codes = Array.from(
    new Set([
      ...(lic.modules || []),
      ...(lic.selected_modules || []),
      ...(lic.dependency_modules || []),
    ])
  ).filter(Boolean);
  const modules = codes.map((code) => moduleLabels?.get(code) || code);
  const packCodes = extractFeaturePackNames(lic.feature_packs);
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
    package_type: lic.package_type || null,
    billing_cycle: lic.billing_cycle || null,
    modules,
    module_codes: codes,
    feature_packs: packCodes.map((code) =>
      formatFeaturePackLabel(code, featurePackLabels)
    ),
    feature_pack_codes: packCodes,
    tenant_limits: lic.tenant_limits
      ? {
          users: lic.tenant_limits.users ?? lic.max_users ?? null,
          companies: lic.tenant_limits.companies ?? null,
          branches: lic.tenant_limits.branches ?? null,
          warehouses: lic.tenant_limits.warehouses ?? null,
          storage:
            (lic.tenant_limits as Record<string, unknown>).storage != null
              ? Number((lic.tenant_limits as Record<string, unknown>).storage)
              : null,
          api:
            (lic.tenant_limits as Record<string, unknown>).api != null
              ? Number((lic.tenant_limits as Record<string, unknown>).api)
              : null,
        }
      : lic.max_users != null
        ? { users: lic.max_users, companies: null, branches: null, warehouses: null }
        : null,
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
        return String(row.code || row.slug || row.name || row.label || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function normalizeCommercialRenewal(raw: Record<string, unknown>): CommercialRenewal {
  const renewalDate =
    raw.renewal_date || raw.payment_date || raw.completed_at || raw.created_at || null;
  return {
    id: String(raw.id || ""),
    subscription_id: raw.subscription_id ? String(raw.subscription_id) : undefined,
    license_id: raw.license_id ? String(raw.license_id) : null,
    status: raw.status ? String(raw.status) : undefined,
    renewal_date: renewalDate ? String(renewalDate).slice(0, 10) : null,
    previous_expiry:
      raw.previous_expiry || raw.old_expiry
        ? String(raw.previous_expiry || raw.old_expiry).slice(0, 10)
        : null,
    new_expiry: raw.new_expiry ? String(raw.new_expiry).slice(0, 10) : null,
    amount: raw.amount != null ? Number(raw.amount) : null,
    currency: raw.currency ? String(raw.currency) : null,
  };
}

function extractModuleLabels(
  source: unknown,
  labels?: Map<string, string>
): string[] {
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (typeof item === "string") {
        const code = item.trim();
        return labels?.get(code) || code;
      }
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const code = String(row.code || row.slug || "").trim();
        const name = String(row.name || row.label || "").trim();
        if (name) return name;
        if (code) return labels?.get(code) || code;
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

function pickPortalDisplayName(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return null;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
      return null;
    }
    return raw;
  }
  if (typeof value === "object") {
    const row = value as Record<string, unknown>;
    return (
      pickPortalDisplayName(row.name) ||
      pickPortalDisplayName(row.label) ||
      pickPortalDisplayName(row.title)
    );
  }
  return null;
}

function resolveCompanyNames(
  company: Record<string, unknown> | null,
  customer: CustomerProfile | null
) {
  const commercial =
    company?.commercial && typeof company.commercial === "object"
      ? (company.commercial as Record<string, unknown>)
      : null;
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
      pickPortalDisplayName(company?.industry_name) ||
      pickPortalDisplayName(commercial?.industry) ||
      pickPortalDisplayName(customer?.industry_name) ||
      null,
    category:
      pickPortalDisplayName(company?.business_category_name) ||
      pickPortalDisplayName(commercial?.category) ||
      pickPortalDisplayName(customer?.business_category_name) ||
      null,
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
        featurePacks: lic
          ? extractFeaturePackNames(lic.feature_packs).length
            ? extractFeaturePackNames(lic.feature_packs)
            : featurePacks
          : featurePacks,
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
    featurePacks: extractFeaturePackNames(lic.feature_packs).length
      ? extractFeaturePackNames(lic.feature_packs)
      : featurePacks,
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
  const total = Number(inv.grand_total ?? inv.total ?? 0);
  const amountPaid = Number(inv.amount_paid ?? 0);
  const amountDue = Math.max(0, total - amountPaid);
  const isPaid =
    status === "paid" ||
    (total > 0 && amountDue <= 0 && amountPaid > 0);
  return {
    id,
    number: inv.invoice_number || inv.id || `INV-${index + 1}`,
    status: inv.status || null,
    paymentStatus: isPaid
      ? "paid"
      : status === "partially_paid"
        ? "partially_paid"
        : inv.status || null,
    date: inv.issue_date || null,
    dueDate: inv.due_date || null,
    amount:
      inv.grand_total != null || inv.total != null
        ? `USD ${total.toFixed(2)}`
        : inv.amount_paid != null && amountPaid > 0
          ? `USD ${amountPaid.toFixed(2)}`
            : null,
    /** PDF download only after License Engine confirms payment. */
    pdfUrl: isPaid ? portalInvoicePdfPath(id) : null,
    documentUrl: portalInvoiceDocumentPath(id),
    amountDue: inv.grand_total != null || inv.total != null ? amountDue : inv.amount_due ?? null,
    amountPaid: inv.amount_paid ?? null,
    currency: "USD",
    total: inv.grand_total ?? inv.total ?? null,
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
    // Prefer first path that succeeds — probe in parallel to cut failover latency.
    const results = await Promise.all(
      paths.map(async (path) => {
        try {
          const res = await fetch(`${base}${path}`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
          if (!res.ok) return null;
          const json = (await res.json()) as {
            success?: boolean;
            data?: Record<string, unknown>;
          };
          if (json.success && json.data && Object.keys(json.data).length) {
            return json.data;
          }
        } catch {
          /* optional ERP data */
        }
        return null;
      })
    );
    return results.find((row) => row != null) ?? null;
  } catch {
    /* optional ERP data */
  }
  return null;
}

const DASHBOARD_CACHE_MS = 45_000;
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
  // ERP stats only need identity email — overlap with wave 1.
  const erpPromise = tryFetchErpStats(me.data.identity.email);

  // When customer product is known upfront, prefetch public catalog in parallel with wave 1.
  const earlyProductSlug = me.data.customer?.product_slug
    ? String(me.data.customer.product_slug)
    : null;
  const earlyCatalogPromise = earlyProductSlug
    ? Promise.all([
        fetchPublicModules(earlyProductSlug),
        fetchPublicCommercialOverview({ product: earlyProductSlug }),
      ])
    : null;

  const [licensesRes, sessionsRes, subsRes, companyRes, gatewaysRes, usageRes] =
    await Promise.all([
      identityListLicenses(token),
      identityListSessions(token),
      fetchMySubscriptions(token, { limit: 50 }),
      fetchBillingCompany(token),
      fetchBillingGateways(token),
      fetchBillingUsage(token),
    ]);

  const productSlugHint =
    me.data.customer?.product_slug ||
    (Array.isArray(licensesRes.data) && licensesRes.data[0]?.product_slug) ||
    "waamto-erp";

  let modulesCatalogRes: Awaited<ReturnType<typeof fetchPublicModules>>;
  let commercialOverviewRes: Awaited<ReturnType<typeof fetchPublicCommercialOverview>>;
  if (earlyCatalogPromise && earlyProductSlug === String(productSlugHint)) {
    [modulesCatalogRes, commercialOverviewRes] = await earlyCatalogPromise;
  } else {
    [modulesCatalogRes, commercialOverviewRes] = await Promise.all([
      fetchPublicModules(String(productSlugHint)),
      fetchPublicCommercialOverview({ product: String(productSlugHint) }),
    ]);
  }

  const [invoicesRes, paymentsRes, renewalsRes, engineDashboardRes, notificationsRes] =
    await Promise.all([
      fetchMyInvoices(token, { limit: 50 }),
      fetchMyPayments(token, { limit: 50 }),
      fetchMyRenewals(token),
      fetchBillingDashboard(token),
      fetchMyNotifications(token, { limit: 20 }),
    ]);

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

  const moduleLabels = new Map<string, string>();
  for (const mod of modulesCatalogRes.data || []) {
    if (mod?.code) moduleLabels.set(mod.code, mod.name || mod.code);
  }
  const featurePackLabels = new Map<string, string>();
  for (const pack of commercialOverviewRes.data?.feature_packs || []) {
    const code = String(pack.code || pack.slug || "").trim();
    if (code) featurePackLabels.set(code, pack.name || code);
  }

  const company = companyRes.ok ? companyRes.data : null;
  const commercialSnapshot = normalizePortalCommercialSnapshot(
    company as Record<string, unknown> | null
  );
  const catalogModuleCodes = (modulesCatalogRes.data || [])
    .map((mod) => String(mod?.code || "").trim())
    .filter(Boolean);
  const catalogModules = (modulesCatalogRes.data || [])
    .map((mod) => {
      const code = String(mod?.code || "").trim();
      if (!code) return null;
      return {
        code,
        name: String(mod?.name || code),
        description: mod?.description ?? null,
        monthly_price:
          typeof mod?.monthly_price === "number" ? mod.monthly_price : null,
        yearly_price:
          typeof mod?.yearly_price === "number" ? mod.yearly_price : null,
        lifetime_price:
          typeof mod?.lifetime_price === "number" ? mod.lifetime_price : null,
      };
    })
    .filter(Boolean) as PortalDashboard["catalogModules"];
  const catalogFeaturePacks = (commercialOverviewRes.data?.feature_packs || [])
    .map((pack) => {
      const code = String(pack.code || pack.slug || "").trim();
      if (!code) return null;
      const required =
        Array.isArray(pack.required_module_codes)
          ? pack.required_module_codes.map(String)
          : Array.isArray(pack.dependency_modules)
            ? pack.dependency_modules.map(String)
            : Array.isArray(pack.modules)
              ? pack.modules.map(String)
              : undefined;
      return {
        code,
        name: pack.name || code,
        description: pack.description ?? null,
        required_module_codes: required,
        monthly_price:
          typeof pack.monthly_price === "number" ? pack.monthly_price : null,
        yearly_price:
          typeof pack.yearly_price === "number" ? pack.yearly_price : null,
        lifetime_price:
          typeof pack.lifetime_price === "number" ? pack.lifetime_price : null,
        cycle_price:
          typeof pack.cycle_price === "number" ? pack.cycle_price : null,
      };
    })
    .filter(Boolean) as PortalDashboard["catalogFeaturePacks"];

  let licenses = rawLicenses.map((lic) =>
    toPortalLicense(lic, moduleLabels, featurePackLabels)
  );
  const primaryRaw = primaryLicense(rawLicenses);
  const snapshotLimits = normalizeSnapshotLimits(
    (commercialSnapshot?.purchased_limits as Record<string, unknown> | undefined) ||
      (commercialSnapshot?.limits as Record<string, unknown> | undefined)
  );
  if (Object.values(snapshotLimits).some((v) => v != null)) {
    const primaryLicId = primaryRaw?.id;
    licenses = licenses.map((lic) => {
      if (primaryLicId && lic.id !== primaryLicId) return lic;
      return {
        ...lic,
        tenant_limits: {
          ...lic.tenant_limits,
          users: snapshotLimits.users ?? lic.tenant_limits?.users ?? null,
          companies: snapshotLimits.companies ?? lic.tenant_limits?.companies ?? null,
          branches: snapshotLimits.branches ?? lic.tenant_limits?.branches ?? null,
          warehouses: snapshotLimits.warehouses ?? lic.tenant_limits?.warehouses ?? null,
          storage: snapshotLimits.storage ?? lic.tenant_limits?.storage ?? null,
        },
      };
    });
  }
  const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
  const primary = primaryRaw;
  const trial = trialFromLicenses(rawLicenses);
  const erp = sanitizeErpPayload(await erpPromise);

  const engineDashboard = engineDashboardRes.ok ? engineDashboardRes.data : null;
  const pendingCheckoutRaw =
    engineDashboard &&
    typeof engineDashboard === "object" &&
    (engineDashboard as Record<string, unknown>).pending_checkout &&
    typeof (engineDashboard as Record<string, unknown>).pending_checkout === "object"
      ? ((engineDashboard as Record<string, unknown>).pending_checkout as Record<
          string,
          unknown
        >)
      : null;
  const pendingCheckout =
    pendingCheckoutRaw && String(pendingCheckoutRaw.session_token || "").trim()
      ? {
          session_token: String(pendingCheckoutRaw.session_token).trim(),
          status: String(pendingCheckoutRaw.status || "pending"),
          purpose: String(pendingCheckoutRaw.purpose || ""),
          amount: Number(pendingCheckoutRaw.amount || 0),
          currency: String(pendingCheckoutRaw.currency || "USD"),
        }
      : null;
  const gateways = gatewaysRes.ok ? gatewaysRes.data : [];
  const supportTickets = null;
  const supportCounts = null;
  const companyNames = resolveCompanyNames(company, customer);
  const workspaceUsers = mapWorkspaceUsers(usageRes.ok ? usageRes.data : null);
  if (!workspaceUsers.length && identity?.id) {
    workspaceUsers.push({
      id: identity.id,
      email: identity.email || null,
      username: identity.username || null,
      full_name: identity.full_name || null,
      phone: identity.phone || null,
      photo_url: identity.photo_url || null,
      status: identity.status || null,
      email_verified_at: identity.email_verified_at || null,
      last_login_at: identity.last_login_at || null,
      created_at: customer?.created_at || null,
      source: "license_engine",
    });
  }

  const licenseModules = Array.from(
    new Set(licenses.flatMap((l) => l.modules).filter(Boolean))
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
    industry: companyNames.industry,
    businessCategory: companyNames.category,
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
  const commercialRenewals = renewalsRes.ok
    ? (renewalsRes.data || []).map((row) =>
        normalizeCommercialRenewal(row as unknown as Record<string, unknown>)
      )
    : [];

  // Backfill billing cycle / package type from commercial subscription when Engine
  // license row omits them.
  for (const lic of licenses) {
    const linked =
      commercialSubs.find((s) => s.license_id === lic.id) ||
      commercialSubs.find(
        (s) =>
          Boolean(s.product_name) &&
          Boolean(lic.product_name) &&
          s.product_name === lic.product_name
      );
    if (!lic.billing_cycle && linked?.billing_cycle) {
      lic.billing_cycle = linked.billing_cycle;
    }
  }

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

  const licenseFeaturePacks = Array.from(
    new Set(licenses.flatMap((l) => l.feature_packs).filter(Boolean))
  );
  const featurePacks = licenseFeaturePacks;

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

  // Prefer license plan entitlements; do not union full ERP/catalog dumps into portal Modules.
  const modules = licenseModules.length > 0 ? licenseModules : [];

  const commercialJourney = resolveJourneyFromLicenses(licenses);
  const isCustomJourney = commercialJourney === "custom";
  const primaryBillingCycle = resolvePrimaryBillingCycle(
    licenses.find((l) => l.id === primary?.id) || licenses[0] || null,
    commercialSubs
  );
  const customShowsRenew = showRenewalUi(primaryBillingCycle);

  const quickActions = isCustomJourney
    ? [
        ...(customShowsRenew
          ? [
              {
                id: "renew",
                label: "Renew License",
                href: "/portal/billing",
              },
            ]
          : []),
        {
          id: "modules",
          label: "Manage Modules",
          href: "/portal/modules",
        },
        {
          id: "feature_packs",
          label: "Feature Packs",
          href: "/portal/feature-packs",
        },
        {
          id: "limits",
          label: "Tenant Limits",
          href: "/portal/limits",
        },
        {
          id: "custom_erp",
          label: "Modify ERP Configuration",
          href: "/portal/custom-erp",
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
          label: "Active License",
          href: "/portal/licenses",
        },
        {
          id: "org",
          label: "Manage Organization",
          href: "/portal/organization",
        },
        {
          id: "settings",
          label: "Account Settings",
          href: "/portal/settings",
        },
        {
          id: "invoices",
          label: "Invoice History",
          href: "/portal/invoices",
        },
        {
          id: "support",
          label: "Support",
          href: "/portal/support",
        },
        {
          id: "notifications",
          label: "Notifications",
          href: "/portal/notifications",
        },
      ]
    : [
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
          label: "Create New Business",
          href: "/portal/plans?intent=new_place",
        },
        {
          id: "modules",
          label: "View Modules",
          href: "/portal/modules",
        },
        {
          id: "feature_packs",
          label: "Feature Packs",
          href: "/portal/feature-packs",
        },
        {
          id: "limits",
          label: "Tenant Limits",
          href: "/portal/limits",
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
    modules: modules.filter(Boolean),
    featurePacks,
    catalogModuleCodes,
    catalogModules,
    catalogFeaturePacks,
    commercialSnapshot,
    commercialJourney,
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
    pendingCheckout,
    unreadNotifications,
    accessNotice: (() => {
      const notice = licenseAccess.notice;
      if (!notice && pendingCheckout && licenses.length === 0) {
        const underReview =
          String(pendingCheckout.status).toLowerCase() === "awaiting_confirmation";
        return {
          level: underReview ? ("warning" as const) : ("danger" as const),
          status: underReview ? "payment under review" : "pending payment",
          title: underReview ? "Payment under review" : "Payment required",
          message: underReview
            ? "We received your payment proof. License, modules, and ERP activate automatically after approval — no further action needed."
            : "Your portal account is ready. Complete checkout to activate your license, entitlements, and ERP workspace.",
          actionLabel: underReview ? "View checkout status" : "Continue to checkout",
          actionHref: "/portal/checkout?mode=signup",
        };
      }
      if (!notice || !isCustomJourney) return notice;
      // Custom ERP: never send customers into predefined plan upgrade/renew UI.
      if (notice.actionHref && /\/portal\/plans/i.test(notice.actionHref)) {
        return {
          ...notice,
          actionLabel: notice.actionLabel?.includes("upgrade")
            ? "Modify package"
            : "View billing",
          actionHref: notice.actionLabel?.toLowerCase().includes("upgrade")
            ? "/portal/custom-erp"
            : "/portal/billing",
        };
      }
      return notice;
    })(),
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
