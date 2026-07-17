import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/portal",
        "/portal/",
        "/api/",
        "/unauthorized",
        "/forbidden",
        "/maintenance",
        "/verify-email",
        "/reset-password",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
