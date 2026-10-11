import type { Locale } from "@/lib/i18n/config";
import type { SiteSettings } from "@/lib/settings/schema";

type Json = Record<string, unknown>;

export type BreadcrumbEntry = { name: string; href: string };

/**
 * Structured-data builders.
 *
 * Rule enforced throughout: only emit properties backed by information the
 * business has actually confirmed. No invented ratings, review counts, prices
 * or opening hours — a missing property is always better than a false one.
 */

const ORG_ID_PATH = "/#organization";

export function organizationSchema(
  settings: SiteSettings,
  siteUrl: string,
  locale: Locale,
): Json {
  const sameAs = [
    settings.social.facebook,
    settings.social.instagram,
    settings.social.linkedin,
    settings.social.x,
  ].filter(Boolean);

  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}${ORG_ID_PATH}`,
    name: settings.businessName,
    url: siteUrl,
    inLanguage: locale === "fr" ? "fr-FR" : "en-GB",
  };

  if (settings.email) schema.email = settings.email;
  if (settings.phone) schema.telephone = settings.phone;
  if (settings.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: settings.address.street || undefined,
      postalCode: settings.address.postalCode || undefined,
      addressLocality: settings.address.city || undefined,
      addressCountry: settings.seo.countryCode || "FR",
    };
  }
  if (sameAs.length > 0) schema.sameAs = sameAs;

  // Strip undefined values that JSON.stringify would otherwise emit as null.
  return prune(schema) as Json;
}

export function taxiServiceSchema(
  settings: SiteSettings,
  siteUrl: string,
  locale: Locale,
  serviceNames: string[],
): Json {
  const geo =
    settings.seo.latitude && settings.seo.longitude
      ? {
          "@type": "GeoCoordinates",
          latitude: settings.seo.latitude,
          longitude: settings.seo.longitude,
        }
      : undefined;

  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    "@id": `${siteUrl}${ORG_ID_PATH}`,
    name: settings.businessName,
    url: siteUrl,
    inLanguage: locale === "fr" ? "fr-FR" : "en-GB",
    provider: { "@id": `${siteUrl}${ORG_ID_PATH}` },
    areaServed: settings.coverageArea
      ? {
          "@type": "City",
          name: settings.coverageArea,
          containedInPlace: { "@type": "Country", name: "France" },
        }
      : undefined,
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${siteUrl}/demande-de-devis`,
      servicePhone: settings.phone ? { "@type": "ContactPoint", telephone: settings.phone, contactType: "customer service" } : undefined,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: serviceNames.length > 0 ? serviceNames.join(", ") : undefined,
      itemListElement: serviceNames.map((name, index) => ({
        "@type": "Offer",
        position: index + 1,
        itemOffered: { "@type": "Service", name },
      })),
    },
    geo,
  };

  // Only advertise hours once the owner has actually filled them in.
  if (settings.openingHours) {
    schema.openingHours = settings.openingHours;
  }

  return prune(schema) as Json;
}

export function breadcrumbSchema(
  items: BreadcrumbEntry[],
  siteUrl: string,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.href}`,
    })),
  };
}

export function blogPostingSchema(
  post: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    publishedAt: Date | null;
    updatedAt: Date;
    coverImageUrl: string | null;
    authorName: string | null;
  },
  siteUrl: string,
  locale: Locale,
  businessName: string,
): Json {
  const url = `${siteUrl}/blog/${post.slug}`;
  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title.slice(0, 110),
    inLanguage: locale === "fr" ? "fr-FR" : "en-GB",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: (post.publishedAt ?? post.updatedAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: post.authorName || businessName,
    },
    publisher: { "@id": `${siteUrl}${ORG_ID_PATH}` },
  };

  if (post.excerpt) schema.description = post.excerpt;
  if (post.coverImageUrl) schema.image = post.coverImageUrl;

  return prune(schema) as Json;
}

export function faqSchema(
  entries: { question: string; answer: string }[],
): Json | null {
  if (entries.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export function serviceSchema(
  settings: SiteSettings,
  siteUrl: string,
  locale: Locale,
  input: { name: string; description: string; path: string },
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    inLanguage: locale === "fr" ? "fr-FR" : "en-GB",
    serviceType: input.name,
    url: `${siteUrl}${input.path}`,
    provider: { "@id": `${siteUrl}${ORG_ID_PATH}` },
    areaServed: settings.coverageArea || undefined,
  };
}

/** Remove `undefined` entries so the emitted JSON stays clean. */
function prune(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(prune);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Json)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, prune(v)]),
    );
  }
  return value;
}

/**
 * Serialise a JSON-LD graph into a `<script>` tag.
 * `<` is escaped so a stray sequence in user-authored content can never break
 * out of the script element.
 */
export function serializeJsonLd(data: Json | Json[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}