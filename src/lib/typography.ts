/**
 * Centralized typography class names for consistent enterprise SaaS hierarchy.
 * Prefer these over ad-hoc font-family / size utilities.
 */
export const typography = {
  /** Hero / page H1 */
  hero: "font-heading text-hero font-semibold tracking-tight text-balance",
  /** Section titles (H2) */
  sectionTitle: "font-heading text-section font-semibold tracking-tight text-balance",
  /** Pricing / feature / card titles (H3–H4 scale) */
  cardTitle: "font-heading text-card-title font-semibold tracking-tight",
  featureTitle: "font-heading text-feature-title font-semibold tracking-tight",
  pricingTitle: "font-heading text-pricing-title font-semibold tracking-tight",
  ctaHeading: "font-heading text-cta font-semibold tracking-tight text-balance",
  h1: "font-heading text-h1 font-semibold tracking-tight text-balance",
  h2: "font-heading text-h2 font-semibold tracking-tight text-balance",
  h3: "font-heading text-h3 font-semibold tracking-tight",
  h4: "font-heading text-h4 font-semibold tracking-tight",
  /** Body copy */
  body: "font-sans text-body font-normal leading-relaxed",
  bodyMedium: "font-sans text-body font-medium leading-relaxed",
  description: "font-sans text-description font-normal leading-relaxed text-muted-foreground",
  label: "font-sans text-label font-medium",
  nav: "font-sans text-nav font-medium",
  button: "font-sans font-medium",
  caption: "font-sans text-caption font-normal",
  table: "font-sans text-table font-normal",
  footer: "font-sans text-footer font-normal",
  tooltip: "font-sans text-tooltip font-normal leading-snug",
} as const;

export type TypographyKey = keyof typeof typography;
