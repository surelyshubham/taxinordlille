import type { MetadataRoute } from "next";

import { getPublishedSlugsForSitemap } from "@/lib/blog/queries";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/settings";

/**
 * XML sitemap covering both languages.
 *
 * Every query is individually guarded: a sitemap is generated at build time and
 * must never be the reason a build or a crawl fails.
 */

const STATIC_PATHS = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/services/taxi-gare-lille", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/services/transfert-aeroport-lille", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/services/trajets-longue-distance", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/demande-de-devis", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" as const },
  {
    path: "/politique-de-confidentialite",
    priority: 0.3,
    changeFrequency: "yearly" as const,
  },
  { path: "/gestion-des-cookies", priority: 0.2, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  let posts: { slug: string; updatedAt: Date }[] = [];
  try {
    posts = await getPublishedSlugsForSitemap();
  } catch {
    posts = [];
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of ["fr", "en"] as Locale[]) {
    for (const item of STATIC_PATHS) {
      entries.push({
        url: `${siteUrl}${localizedHref(locale, item.path)}`,
        lastModified: now,
        changeFrequency: item.changeFrequency,
        priority: item.priority,
      });
    }

    for (const post of posts) {
      entries.push({
        url: `${siteUrl}${localizedHref(locale, `/blog/${post.slug}`)}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}