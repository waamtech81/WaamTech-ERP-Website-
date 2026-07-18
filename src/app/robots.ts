import type { MetadataRoute } from "next";
import { buildAbsoluteSiteUrl } from "@/lib/urls";

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
    sitemap: buildAbsoluteSiteUrl("/sitemap.xml"),
  };
}
