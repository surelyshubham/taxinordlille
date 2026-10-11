/**
 * Canonical origin resolution.
 *
 * Kept free of any database import so it can be used by build-time route
 * metadata (`robots.txt`, `sitemap.xml`) without pulling in Neon.
 */

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}