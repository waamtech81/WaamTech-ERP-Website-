/** License Engine public commercial catalog + billing shapes (Website presentation only). */

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  product_code: string | null;
  version: string;
  description: string | null;
  status: string;
  display_order: number;
  is_public: boolean;
  icon: string | null;
  color: string | null;
  logo_url: string | null;
  product_type: string;
};

export type CatalogPlan = {
  id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  product_code: string | null;
  name: string;
  slug: string;
  plan_code: string;
  plan_version: string;
  description: string | null;
  tier: string;
  plan_type: string;
  pricing_type: "fixed" | "custom" | "free" | string;
  currency: string;
  monthly_price: number | null;
  yearly_price: number | null;
  lifetime_price: number | null;
  price: number | null;
  has_free_trial: boolean;
  trial_days: number | null;
  grace_period_days: number;
  contact_sales: boolean;
  sort_order: number;
  is_active: boolean;
  is_public: boolean;
};

export type CatalogPricing = {
  plan_id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  plan_code: string;
  name: string;
  slug: string;
  tier: string;
  pricing_type: string;
  currency: string;
  monthly_price: number | null;
  yearly_price: number | null;
  lifetime_price: number | null;
  contact_sales: boolean;
  has_free_trial: boolean;
  trial_days: number | null;
};

export type CatalogIndustry = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: string;
  display_order: number;
  is_public: boolean;
};

export type CatalogBusinessCategory = {
  id: string;
  industry_id: string | null;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: string;
  display_order: number;
  is_public: boolean;
};

export type CatalogBusinessProfile = {
  id: string;
  category_id: string | null;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: string;
  display_order: number;
  is_public: boolean;
};

export type CommercialSubscription = {
  id: string;
  subscription_number?: string;
  customer_id: string;
  product_id: string;
  plan_id: string;
  license_id?: string | null;
  status: string;
  billing_cycle?: string;
  start_date?: string | null;
  renewal_date?: string | null;
  expiry_date?: string | null;
  cancellation_date?: string | null;
  trial_ends_at?: string | null;
  auto_renewal?: boolean;
  grace_period_days?: number;
  currency?: string;
  unit_price?: number | null;
  company_name?: string | null;
  product_name?: string | null;
  plan_name?: string | null;
};

export type CommercialInvoice = {
  id: string;
  invoice_number?: string;
  customer_id: string;
  subscription_id?: string | null;
  status: string;
  currency?: string;
  subtotal?: number | null;
  tax_amount?: number | null;
  total?: number | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  issue_date?: string | null;
  due_date?: string | null;
  paid_date?: string | null;
  company_name?: string | null;
  pdf_url?: string | null;
};

export type CommercialPayment = {
  id: string;
  transaction_id?: string;
  reference_number?: string | null;
  customer_id: string;
  invoice_id?: string | null;
  subscription_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  gateway?: string | null;
  payment_method?: string | null;
  paid_date?: string | null;
  company_name?: string | null;
  invoice_number?: string | null;
};

export type CommercialRenewal = {
  id: string;
  subscription_id?: string;
  license_id?: string | null;
  status?: string;
  renewal_date?: string | null;
  previous_expiry?: string | null;
  new_expiry?: string | null;
  amount?: number | null;
  currency?: string | null;
};

export type CustomerBillingHistory = {
  customer_id: string;
  subscriptions: CommercialSubscription[];
  invoices: CommercialInvoice[];
  payments: CommercialPayment[];
  renewals: CommercialRenewal[];
  credits?: unknown[];
};

export type CatalogFetchResult<T> = {
  ok: boolean;
  status: number;
  message: string;
  data: T;
  stale?: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
