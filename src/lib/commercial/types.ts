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
  price_model?: "per_user" | "flat_rate" | "one_time" | "custom" | string | null;
  price_unit?: string | null;
  card_summary?: CatalogCardSummary | null;
};

export type CatalogCardSummary = {
  target_customer?: string | null;
  included_users_label?: string | null;
  billing_model?: string | null;
  price_unit?: string | null;
  support_level?: string | null;
  plus_from?: string | null;
  upgrade_reason?: string | null;
  bullets?: string[];
  main_limits?: {
    included_users?: number | null;
    unlimited_users?: boolean;
    storage_gb?: number | null;
    unlimited_storage?: boolean;
  } | null;
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
  price_model?: "per_user" | "flat_rate" | "one_time" | "custom" | string | null;
  price_unit?: string | null;
  card_summary?: CatalogCardSummary | null;
};

export type CatalogComparisonDimension = {
  key: string;
  label: string;
};

export type CatalogFeatureMatrixCell = {
  included: boolean;
  inherited?: boolean;
  source_tier?: string | null;
};

export type CatalogFeatureMatrixRow = {
  feature_id?: string;
  code?: string | null;
  name: string;
  description?: string | null;
  display_order?: number;
  plans: Record<string, CatalogFeatureMatrixCell>;
};

export type CatalogFeatureMatrixGroup = {
  code?: string;
  name: string;
  display_order?: number;
  rows: CatalogFeatureMatrixRow[];
};

export type CatalogFeatureMatrix = {
  plan_slugs?: string[];
  hierarchy?: string[];
  groups?: CatalogFeatureMatrixGroup[];
  feature_count?: number;
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
  price_model?: string | null;
  price_unit?: string | null;
  comparison_values?: Record<string, string | number | boolean | null>;
  summary?: Record<string, unknown> | null;
};

export type CatalogComparisonBundle = {
  plans: CatalogPlan[];
  comparison: CatalogComparisonRow[];
  limit_keys: string[];
  dimensions?: CatalogComparisonDimension[];
  feature_matrix?: CatalogFeatureMatrix | null;
  hierarchy?:
    | string[]
    | {
        chain?: string[];
        rule?: string;
      }
    | null;
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
  /** Engine public field */
  pos_requirement?: "required" | "optional" | "disabled" | null;
  /** Engine public field */
  mobile_requirement?: "required" | "optional" | "disabled" | null;
  /** Compatibility aliases used by some mappers */
  pos_mode?: "required" | "optional" | "disabled" | null;
  mobile_mode?: "required" | "disabled" | null;
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

/** License Engine public catalog module (Build Your Own ERP / module pages). */
export type CatalogModule = {
  id: string;
  product_id: string | null;
  code: string;
  name: string;
  slug: string;
  version: string;
  description: string | null;
  category: string | null;
  industry: string | null;
  /** Required dependency module codes (mandatory). */
  dependencies: string[] | null;
  /** Optional recommended module codes. */
  recommended_modules: string[] | null;
  monthly_price: number;
  yearly_price: number;
  lifetime_price: number;
  icon: string | null;
  display_order: number;
  status: string;
  is_public?: boolean;
};

export type CustomPackageRequestPayload = {
  product_slug?: string;
  billing_cycle: BillingCycle;
  contact_name: string;
  contact_email: string;
  company: string;
  phone?: string;
  country_code?: string;
  selected_module_codes: string[];
  recommended_module_codes?: string[];
  user_limit_note?: string;
  notes?: string;
  source?: string;
};

export type CustomPackageRequestResult = {
  id: string;
  status: string;
  billing_cycle: BillingCycle;
  selected_module_codes: string[];
  required_module_codes: string[];
  recommended_module_codes: string[];
  complete_module_codes: string[];
  total_monthly: number;
  total_yearly: number;
  total_lifetime: number;
  user_limit_note?: string | null;
  message?: string;
};

/** License Engine public custom-package quote (live calculator). */
export type CustomPackageQuoteTaxLine = {
  tax_id: string;
  code: string;
  name: string;
  rate: number;
  mode: "inclusive" | "exclusive";
  amount: number;
};

export type CustomPackageQuoteSeatLine = {
  kind: string;
  included: number;
  requested: number;
  extra_qty: number;
  unit_price: number;
  amount: number;
};

export type CustomPackageQuotePricing = {
  currency: string;
  monthly_total: number;
  yearly_total: number;
  lifetime_total: number;
  module_count: number;
  selected_billing_cycle: BillingCycle;
  selected_total: number;
  subtotal: number;
  modules_subtotal?: number;
  feature_pack_total?: number;
  seat_overage_total?: number;
  addons_total?: number;
  discount_code?: string | null;
  discount_id?: string | null;
  discount_type?: "percentage" | "fixed" | null;
  discount_value?: number | null;
  discount_amount?: number;
  tax_id?: string | null;
  tax_amount?: number;
  taxes?: CustomPackageQuoteTaxLine[];
  grand_total: number;
  seat_overage?: {
    lines: CustomPackageQuoteSeatLine[];
    total: number;
  };
  additional_charges?: {
    users?: { qty: number; unit_price: number; amount: number };
    companies?: { qty: number; unit_price: number; amount: number };
    branches?: { qty: number; unit_price: number; amount: number };
    warehouses?: { qty: number; unit_price: number; amount: number };
  };
};

export type CustomPackageBundleOffer = {
  show_bundle_offer: boolean;
  close_match: boolean;
  exact_match: boolean;
  match_score: number;
  matched_plan_id: string | null;
  matched_plan_name: string | null;
  matched_plan_slug: string | null;
  matched_plan_price: number;
  custom_price: number;
  bundle_savings: number;
  bundle_percentage: number;
  continue_custom: boolean;
  switch_to_plan: boolean;
  message: string | null;
  match_reason: string | null;
  enable_savings_banner: boolean;
  included_modules: string[];
  included_feature_packs: string[];
  included_limits: {
    users: number;
    companies: number;
    branches: number;
    warehouses: number;
  } | null;
  matched_plan?: Record<string, unknown> | null;
};

export type CustomPackageQuoteResult = {
  package_type: "custom";
  selected_modules: string[];
  dependency_modules: string[];
  recommended_modules: string[];
  effective_modules?: string[];
  selected_feature_packs?: string[];
  pricing: CustomPackageQuotePricing;
  included_limits?: {
    users: number;
    companies: number;
    branches: number;
    warehouses: number;
  } | null;
  show_bundle_offer?: boolean;
  match_score?: number;
  close_match?: boolean;
  exact_match?: boolean;
  matched_plan_id?: string | null;
  matched_plan_name?: string | null;
  matched_plan_price?: number | null;
  custom_price?: number | null;
  bundle_savings?: number;
  bundle_offer?: CustomPackageBundleOffer | null;
};

export type CustomPackageQuotePayload = {
  product_slug?: string;
  billing_cycle: BillingCycle;
  selected_module_codes: string[];
  discount_code?: string | null;
  industry_id?: string | null;
  category_id?: string | null;
  /** Engine accepts flat seat fields (not a nested tenant_limits object). */
  selected_feature_packs?: string[];
  user_limit?: number;
  company_limit?: number;
  branch_limit?: number;
  warehouse_limit?: number;
};

export type PublicCommercialUnitPrice = {
  included: number;
  monthly: number;
  yearly: number;
  lifetime: number;
};

export type PublicCommercialFeaturePack = {
  code: string;
  slug?: string;
  name: string;
  description?: string | null;
  monthly_price: number | null;
  yearly_price: number | null;
  lifetime_price: number | null;
  is_included?: boolean;
  price_display?: {
    monthly: number | "Included";
    yearly: number | "Included";
    lifetime: number | "Included";
  };
  billing_cycle?: BillingCycle;
  cycle_price?: number | null;
};

export type PublicCommercialOverview = {
  product_slug: string;
  billing_cycle: BillingCycle;
  pricing_cards: Array<{
    id: string;
    name: string;
    slug: string;
    tier?: string | null;
    billing_cycle: BillingCycle;
    price: number | null;
    currency?: string;
    limits?: CatalogPlanLimits | null;
    is_popular?: boolean;
    is_recommended?: boolean;
  }>;
  custom_builder: {
    plan_id: string | null;
    plan_slug: string;
    included_limits: {
      users: number;
      companies: number;
      branches: number;
      warehouses: number;
    };
    unit_prices: {
      users: PublicCommercialUnitPrice;
      companies: PublicCommercialUnitPrice;
      branches: PublicCommercialUnitPrice;
      warehouses: PublicCommercialUnitPrice;
    };
    feature_pack_default_unit: {
      monthly: number;
      yearly: number;
      lifetime: number;
    };
  };
  feature_packs: PublicCommercialFeaturePack[];
  bundle_config?: Record<string, unknown>;
};
