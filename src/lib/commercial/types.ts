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

export type CatalogCta = {
  text?: string | null;
  style?: string | null;
};

export type CatalogFeatureItem = {
  id: string;
  code?: string | null;
  slug?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  feature_group?: string | null;
  feature_group_id?: string | null;
  icon?: string | null;
  tooltip?: string | null;
  display_order?: number;
  included?: boolean;
  highlighted?: boolean;
  show_green_tick?: boolean;
  green_tick?: boolean;
  inherited?: boolean;
  source_tier?: string | null;
};

export type CatalogFeatureGroup = {
  id: string | null;
  code: string;
  name: string;
  slug?: string | null;
  icon?: string | null;
  display_order?: number;
  features: CatalogFeatureItem[];
};

export type CatalogPlanLimits = {
  plan_id?: string;
  max_users?: number | null;
  max_storage_gb?: number | null;
  max_branches?: number | null;
  max_warehouses?: number | null;
  max_api_calls?: number | null;
  unlimited_users?: boolean;
  unlimited_storage?: boolean;
  unlimited_branches?: boolean;
  unlimited_warehouses?: boolean;
  unlimited_api_calls?: boolean;
  extra_user_price?: number | null;
  extra_storage_price_per_gb?: number | null;
  overage_billing_enabled?: boolean;
  [key: string]: string | number | boolean | null | undefined;
};

export type CatalogPlan = {
  id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  product_code: string | null;
  name: string;
  title?: string | null;
  slug: string;
  seo_slug?: string | null;
  plan_code: string;
  plan_version: string;
  description: string | null;
  tagline?: string | null;
  subtitle?: string | null;
  short_description?: string | null;
  long_description?: string | null;
  marketing_summary?: string | null;
  badge?: string | null;
  badge_label?: string | null;
  ribbon?: string | null;
  icon?: string | null;
  highlight_color?: string | null;
  highlights?: string[];
  support_level?: string | null;
  mobile_app_included?: boolean;
  ios_app_ready?: boolean;
  tier: string;
  plan_type: string;
  pricing_type: "fixed" | "custom" | "free" | string;
  currency: string;
  billing_cycle?: string | null;
  monthly_price: number | null;
  yearly_price: number | null;
  lifetime_price: number | null;
  price: number | null;
  original_price?: number | null;
  launch_price?: number | null;
  display_price?: number | null;
  discount_percentage?: number | null;
  savings_amount?: number | null;
  show_strike_through?: boolean;
  launch_active?: boolean;
  launch_campaign?: string | null;
  launch_badge?: string | null;
  launch_start_date?: string | null;
  launch_end_date?: string | null;
  cta?: CatalogCta | null;
  cta_button_text?: string | null;
  cta_button_style?: string | null;
  has_free_trial: boolean;
  trial_days: number | null;
  grace_period_days: number;
  contact_sales: boolean;
  is_popular?: boolean;
  is_recommended?: boolean;
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
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  marketing_summary?: string | null;
  badge?: string | null;
  badge_label?: string | null;
  ribbon?: string | null;
  icon?: string | null;
  highlight_color?: string | null;
  seo_slug?: string | null;
  slug: string;
  tier: string;
  pricing_type: string;
  currency: string;
  billing_cycle?: string | null;
  monthly_price: number | null;
  yearly_price: number | null;
  lifetime_price: number | null;
  original_price?: number | null;
  launch_price?: number | null;
  display_price?: number | null;
  discount_percentage?: number | null;
  savings_amount?: number | null;
  show_strike_through?: boolean;
  launch_active?: boolean;
  launch_badge?: string | null;
  launch_campaign?: string | null;
  contact_sales: boolean;
  has_free_trial: boolean;
  trial_days: number | null;
  cta?: CatalogCta | null;
  is_popular?: boolean;
  is_recommended?: boolean;
  popular_flag?: boolean;
  recommended_flag?: boolean;
  highlights?: string[];
  feature_groups?: CatalogFeatureGroup[];
  green_tick_features?: CatalogFeatureItem[];
  support_level?: string | null;
  sort_order?: number;
};

export type CatalogComparisonRow = {
  plan: CatalogPlan;
  limits: CatalogPlanLimits;
  features: string[];
  commercial_features?: CatalogFeatureItem[];
  feature_groups?: CatalogFeatureGroup[];
  green_tick_features?: CatalogFeatureItem[];
  modules?: Array<{ code?: string; name?: string; slug?: string }>;
  support_level?: string | null;
  highlights?: string[];
  mobile_app_included?: boolean;
  badge?: string | null;
  cta?: CatalogCta | null;
  show_strike_through?: boolean;
  original_price?: number | null;
  display_price?: number | null;
  is_popular?: boolean;
  is_recommended?: boolean;
};

export type CatalogComparisonBundle = {
  plans: CatalogPlan[];
  comparison: CatalogComparisonRow[];
  limit_keys: string[];
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

/** Industry-scoped business type (License Engine catalog_business_types). */
export type CatalogBusinessType = {
  id: string;
  industry_id?: string | null;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status?: string;
  display_order: number;
  is_public?: boolean;
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

/** Billing cycle selected on the Website pricing UI (passed through to signup). */
export type BillingCycle = "monthly" | "yearly" | "lifetime";
