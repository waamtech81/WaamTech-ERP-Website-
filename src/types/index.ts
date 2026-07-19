export type NavItem = {
  title: string;
  href: string;
  description?: string;
  icon?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  icon: string;
  features: string[];
  status: "available" | "coming-soon";
};

export type Industry = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  benefits: string[];
};

export type PricingFeature = {
  id: string;
  name: string;
  description?: string | null;
  tooltip?: string | null;
  highlighted?: boolean;
  greenTick?: boolean;
  inherited?: boolean;
  category?: string | null;
};

export type PricingFeatureGroup = {
  id: string;
  code: string;
  name: string;
  icon?: string | null;
  features: PricingFeature[];
};

export type PricingPlan = {
  id: string;
  /** License Engine plan UUID */
  planId?: string;
  productId?: string;
  productSlug?: string;
  name: string;
  subtitle?: string | null;
  description?: string;
  marketingSummary?: string | null;
  monthlyPrice: number | null;
  /** Per-month equivalent when billed yearly (Engine yearly_price / 12). */
  yearlyPrice: number | null;
  /** Full annual amount from Engine yearly_price. */
  yearlyTotal?: number | null;
  originalMonthlyPrice?: number | null;
  originalYearlyPrice?: number | null;
  originalYearlyTotal?: number | null;
  lifetimePrice?: number | null;
  originalLifetimePrice?: number | null;
  displayPrice?: number | null;
  launchPrice?: number | null;
  launchDiscount?: number;
  savingsAmount?: number | null;
  yearlySavingsAmount?: number | null;
  showStrikeThrough?: boolean;
  launchActive?: boolean;
  launchCampaign?: string | null;
  launchBadge?: string | null;
  billingCycle?: string | null;
  currency?: string | null;
  badge?: string;
  ribbon?: string | null;
  popular?: boolean;
  recommended?: boolean;
  cta: string;
  ctaStyle?: string | null;
  href: string;
  /** Seat allowance shown on pricing cards */
  usersIncluded?: number | "unlimited";
  /** e.g. "Extra users available on demand" */
  usersNote?: string;
  extraUserPrice?: number | null;
  storageIncludedGb?: number | "unlimited" | null;
  extraStoragePricePerGb?: number | null;
  supportLevel?: string | null;
  /** Modules included in this plan (user-facing names) */
  modules?: string[];
  highlights?: string[];
  featureGroups?: PricingFeatureGroup[];
  features: string[];
  hasFreeTrial?: boolean;
  trialDays?: number | null;
  contactSales?: boolean;
};

export type DeploymentOption = {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlights: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

export type ServerOffering = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  image: string;
  priceFrom: number;
  originalPrice?: number;
  features: string[];
  href: string;
  external?: boolean;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  /** WebP cover — Unsplash or local, sized for cards/detail. */
  image: string;
  /** Detail body paragraphs shown on `/blog/[slug]`. */
  content: string[];
  featured?: boolean;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  rating: number;
};

export type CaseStudy = {
  id: string;
  title: string;
  industry: string;
  result: string;
  metric: string;
  description: string;
};

export type DocCategory = {
  id: string;
  title: string;
  description: string;
  articles: { title: string; href: string }[];
};

export type KbArticle = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  popular?: boolean;
};
