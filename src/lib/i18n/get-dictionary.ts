import "server-only";

import type { Locale } from "@/lib/i18n/config";
import fr from "./dictionaries/fr.json";
import en from "./dictionaries/en.json";

/**
 * French is the source of truth for the dictionary shape; the English file is
 * checked against it at compile time so the two can never drift apart.
 */
export type Dictionary = typeof fr;

const dictionaries: Record<Locale, Dictionary> = { fr: fr as Dictionary, en };

// Compile-time guard: `en.json` must satisfy the exact French structure.
const _enMustMatchFrenchShape: Dictionary = en;
void _enMustMatchFrenchShape;

/**
 * Resolve a dictionary for a locale.
 *
 * The locale is always passed explicitly rather than read from
 * `next/root-params`: that API is only available in Server Components, and
 * passing it keeps the same helper usable from Server Actions and layout code.
 */
export async function getDictionaryFor(
  locale: Locale,
): Promise<Dictionary> {
  return dictionaries[locale];
}