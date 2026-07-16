import type { MetadataRoute } from "next";
import { blogPosts, siteConfig } from "@/lib/data/site";

const routes = [
  "",
  "/products",
  "/erp-features",
  "/industries",
  "/pricing",
  "/plans",
  "/signup",
  "/login",
  "/portal",
  "/docs",
  "/knowledge-base",
  "/support",
  "/contact",
  "/about",
  "/blog",
  "/faqs",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...routes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...blogPosts.map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
