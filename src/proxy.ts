import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

/** Generated files and assets must never be locale-routed. */
const STATIC_FILE = /\.[a-zA-Z0-9]+$/;

/**
 * Locale routing only.
 *
 * - `/`, `/services`, `/admin` … are rewritten onto the `/[lang]` segment with
 *   the French content set, so the primary market keeps clean root URLs.
 * - `/en/...` is served directly in English.
 * - `/fr/...` 308-redirects to its canonical, unprefixed form.
 *
 * Deliberately performs no authentication: Proxy may run at the CDN edge, so
 * every admin read and mutation is authorised server-side in the data layer.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = pathname.split("/")[1];

  // The admin panel is French-only — never expose a second copy under /en.
  if (pathname === "/en/admin" || pathname.startsWith("/en/admin/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice("/en".length) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (isLocale(segment)) {
    if (segment !== defaultLocale) return NextResponse.next();

    // `/fr/services` -> `/services`, `/fr` and `/fr/` -> `/`
    const url = request.nextUrl.clone();
    const stripped = pathname.slice("/fr".length).replace(/\/+$/, "");
    url.pathname = stripped || "/";
    return NextResponse.redirect(url, 308);
  }

  if (pathname !== "/" && STATIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  // `/services` -> `/fr/services`
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Everything except Next internals, API routes and SEO/metadata files.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};