import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/data/site";
import { getEnginePublicIndustries } from "@/lib/commercial/engine-industry-ssot";
import { LANGUAGE_CODES } from "@/i18n";
import { buildAbsoluteSiteUrl, getSiteOrigin } from "@/lib/urls";

const routes = [
  "",
  "/products",
  "/erp-features",
  "/industries",
  "/pricing",
  "/servers",
  "/security",
  "/mobile-app",
  "/signup",
  "/login",
  "/forgot-password",
  "/support",
  "/contact",
  "/about",
  "/blog",
  "/faqs",
  "/privacy",
  "/terms",
];

/** hreflang alternates: default (clean) URL + one ?lang= variant per language. */
function languageAlternates(path: string): Record<string, string> {
  const base = buildAbsoluteSiteUrl(path || "/");
  const languages: Record<string, string> = { "x-default": base };
  for (const code of LANGUAGE_CODES) {
    languages[code] = `${base}${base.includes("?") ? "&" : "?"}lang=${code}`;
  }
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const origin = getSiteOrigin();
  // Industry URLs come from License Engine public catalog (SSOT), not a local registry.
  const industries = await getEnginePublicIndustries();
  return [
    ...routes.map((route) => ({
      url: route ? buildAbsoluteSiteUrl(route) : origin,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
      alternates: { languages: languageAlternates(route) },
    })),
    ...blogPosts.map((post) => ({
      url: buildAbsoluteSiteUrl(`/blog/${post.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      alternates: { languages: languageAlternates(`/blog/${post.slug}`) },
    })),
    ...industries.map((industry) => ({
      url: buildAbsoluteSiteUrl(`/industries/${industry.id}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
      alternates: { languages: languageAlternates(`/industries/${industry.id}`) },
    })),
  ];
}
