import type { Metadata } from "next";

import { localizedHref, type Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/settings";
import type { SiteSettings } from "@/lib/settings/schema";

export type PageMetaInput = {
  locale: Locale;
  settings: SiteSettings;
  /** Path *without* the locale prefix, e.g. `/services/taxi-gare-lille`. */
  path?: string;
  title: string;
  description: string;
  /** Absolute or root-relative OG image. */
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
  /** Set false on pages that must never be indexed (admin preview, thank-you). */
  index?: boolean;
};

/**
 * Single source of truth for page metadata: title template, description,
 * canonical URL, hreflang alternates for both languages, Open Graph and
 * Twitter cards.
 */
export function buildMetadata({
  locale,
  settings,
  path = "/",
  title,
  description,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  index = true,
}: PageMetaInput): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}${localizedHref(locale, path)}`;

  const ogImage = image ?? settings.seo.ogImageUrl ?? null;
  const images = ogImage
    ? [
        {
          url: ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ]
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        fr: `${siteUrl}${localizedHref("fr", path)}`,
        en: `${siteUrl}${localizedHref("en", path)}`,
        "x-default": `${siteUrl}${localizedHref("fr", path)}`,
      },
    },
    openGraph: {
      type,
      siteName: settings.businessName,
      title,
      description,
      url: canonical,
      locale: locale === "fr" ? "fr_FR" : "en_GB",
      alternateLocale: locale === "fr" ? "en_GB" : "fr_FR",
      images,
      ...(type === "article" && publishedTime
        ? { publishedTime: publishedTime.toISOString() }
        : {}),
      ...(type === "article" && modifiedTime
        ? { modifiedTime: modifiedTime.toISOString() }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.map((entry) => entry.url),
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false },
        },
  };
}