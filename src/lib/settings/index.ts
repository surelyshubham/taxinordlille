import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import {
  DEFAULT_SETTINGS,
  siteSettingsSchema,
  type SiteSettings,
} from "./schema";

/** The settings table holds exactly one row, pinned to id = 1. */
const SETTINGS_ROW_ID = 1;

/**
 * Read the editable site configuration.
 *
 * A missing row is a legitimate state (fresh install before the owner has
 * saved anything), so it falls back to the shipped defaults. A *malformed* row
 * falls back to defaults too, and the parse problem is surfaced in the server
 * log rather than crashing the site on a bad hand-edit.
 *
 * Deliberately not cached across requests: this is a single indexed row read
 * and it must never serve stale phone numbers or addresses to customers.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const row = await getDb()
    .query.siteSettings.findFirst({
      where: eq(siteSettings.id, SETTINGS_ROW_ID),
    });

  if (!row) return DEFAULT_SETTINGS;

  const parsed = siteSettingsSchema.safeParse(row.data);
  if (parsed.success) return parsed.data;

  console.error(
    "[settings] Stored settings failed validation:",
    parsed.error.issues,
  );
  return DEFAULT_SETTINGS;
});

export { getSiteUrl } from "./url";