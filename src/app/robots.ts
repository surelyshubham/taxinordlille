import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/settings";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The admin area holds customer data and must never be indexed.
        disallow: ["/admin", "/admin/", "/fr/admin", "/en/admin"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}