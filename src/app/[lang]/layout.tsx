import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";

import "@/app/globals.css";
import { isLocale, localeTags, type Locale } from "@/lib/i18n/config";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

/** The brand mark is set in a high-contrast serif — headings follow suit. */
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/**
 * Every page reads live data (settings, published posts) and the admin reads
 * session cookies, so the tree is rendered per request rather than baked at
 * build time. See README "Caching" for the upgrade path.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    other: { "content-language": isLocale(lang) ? localeTags[lang] : "fr-FR" },
  };
}

export const viewport: Viewport = {
  themeColor: "#050404",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Root shell.
 *
 * Deliberately free of any database access: the admin sign-in screen must
 * render even when the database is unreachable, otherwise an operator cannot
 * get in to diagnose it. Business data (site settings) is read inside the
 * `(site)` and `(protected)` route groups, which own the components that need it.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;

  return (
    <html
      lang={localeTags[locale]}
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-canvas text-content-body antialiased">
        {children}
      </body>
    </html>
  );
}