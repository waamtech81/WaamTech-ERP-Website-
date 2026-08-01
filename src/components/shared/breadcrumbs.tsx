/**
 * Breadcrumb UI removed site-wide (marketing preference).
 * Keep the export so existing page imports stay compatible.
 * Structured data for SEO is handled via page-level metadata / JSON-LD elsewhere.
 */
export function Breadcrumbs(_props: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return null;
}
