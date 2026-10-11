export const locales = ["fr", "en"] as const;

export type Locale = (typeof locales)[number];

/** French is the primary market, so it is served from the site root. */
export const defaultLocale: Locale = "fr";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

/** BCP-47 tags used for `<html lang>` and `Intl` formatting. */
export const localeTags: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
};

/**
 * Build a canonical href for a locale.
 *
 * French lives at the root (`/services`), English under a prefix
 * (`/en/services`). Keeping the default locale unprefixed means the primary
 * market gets clean, link-equivalent canonical URLs.
 */
export function localizedHref(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean || "/";
  return `/${locale}${clean}`;
}

/** The equivalent URL in the other language — used for hreflang alternates. */
export function alternateLocale(current: Locale): Locale {
  return current === defaultLocale ? "en" : defaultLocale;
}