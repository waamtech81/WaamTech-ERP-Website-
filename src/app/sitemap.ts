import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/data/site";
import { businessIndustries } from "@/lib/data/business-hierarchy";
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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const origin = getSiteOrigin();
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
    ...businessIndustries.map((industry) => ({
      url: buildAbsoluteSiteUrl(`/industries/${industry.id}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
      alternates: { languages: languageAlternates(`/industries/${industry.id}`) },
    })),
  ];
}
