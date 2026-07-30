import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/data/site";
import { getEnginePublicIndustries } from "@/lib/commercial/engine-industry-ssot";
import { buildAbsoluteSiteUrl, getSiteOrigin } from "@/lib/urls";

const routes = [
  "",
  "/products",
  "/modules",
  "/build-your-own-erp",
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const origin = getSiteOrigin();
  const industries = await getEnginePublicIndustries();
  return [
    ...routes.map((route) => ({
      url: route ? buildAbsoluteSiteUrl(route) : origin,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...blogPosts.map((post) => ({
      url: buildAbsoluteSiteUrl(`/blog/${post.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...industries.map((industry) => ({
      url: buildAbsoluteSiteUrl(`/industries/${industry.id}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
