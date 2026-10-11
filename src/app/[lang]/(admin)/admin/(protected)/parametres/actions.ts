"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { adminActivity, siteSettings } from "@/lib/db/schema";
import {
  DEFAULT_SETTINGS,
  siteSettingsSchema,
  toE164,
  type SiteSettings,
} from "@/lib/settings/schema";
import { adminLabels } from "@/lib/admin/labels";

export type SettingsState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Persist the editable site configuration.
 *
 * The incoming values are re-validated with the same Zod schema that guards
 * every read, so a malformed row can never be written. Numbers arriving from
 * form fields are coerced explicitly rather than with `z.coerce`, which keeps
 * an empty input distinguishable from zero.
 */
export async function saveSettingsAction(
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireAdminAction();

  const str = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const num = (key: string, fallback: number) => {
    const parsed = Number.parseInt(str(key), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const whatsappRaw = str("whatsappNumber");
  const whatsappNumber = whatsappRaw ? toE164(whatsappRaw) : "";

  const candidate = {
    businessName: str("businessName") || DEFAULT_SETTINGS.businessName,
    tagline: str("tagline"),
    phone: str("phone") || DEFAULT_SETTINGS.phone,
    phoneDisplay: str("phoneDisplay"),
    whatsappNumber,
    email: str("email"),
    address: {
      street: str("address.street"),
      postalCode: str("address.postalCode"),
      city: str("address.city"),
      country: str("address.country"),
    },
    coverageArea: str("coverageArea"),
    openingHours: str("openingHours"),
    social: {
      facebook: str("social.facebook"),
      instagram: str("social.instagram"),
      linkedin: str("social.linkedin"),
      x: str("social.x"),
    },
    seo: {
      defaultTitle:
        str("seo.defaultTitle") || DEFAULT_SETTINGS.seo.defaultTitle,
      defaultDescription:
        str("seo.defaultDescription") || DEFAULT_SETTINGS.seo.defaultDescription,
      ogImageUrl: str("seo.ogImageUrl"),
      city: str("seo.city"),
      postalCode: str("seo.postalCode"),
      countryCode: str("seo.countryCode"),
      latitude: str("seo.latitude"),
      longitude: str("seo.longitude"),
    },
    legal: {
      legalName: str("legal.legalName"),
      siret: str("legal.siret"),
      rcs: str("legal.rcs"),
      vatNumber: str("legal.vatNumber"),
      insuranceInsurer: str("legal.insuranceInsurer"),
      hostingProvider: str("legal.hostingProvider"),
      dataRetentionMonths: num(
        "legal.dataRetentionMonths",
        DEFAULT_SETTINGS.legal.dataRetentionMonths,
      ),
    },
    notifications: {
      emailTo: str("notifications.emailTo"),
      emailFrom: str("notifications.emailFrom"),
      sendCustomerAcknowledgement: formData.get("sendCustomerAcknowledgement") === "on",
      whatsappRecipient: str("notifications.whatsappRecipient").replace(/\D/g, ""),
    },
  };

  const parsed = siteSettingsSchema.safeParse(candidate);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return {
      status: "error",
      message: adminLabels.settings.saveFailed,
      fieldErrors,
    };
  }

  const data: SiteSettings = parsed.data;

  const updated = await getDb()
    .insert(siteSettings)
    .values({ id: 1, data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { data, updatedAt: new Date() },
    })
    .returning({ id: siteSettings.id });

  await getDb()
    .insert(adminActivity)
    .values({
      userId: user.id,
      action: "settings_update",
      entityType: "site_settings",
      entityId: "1",
    });

  // Settings feed the header, footer, metadata and structured data everywhere.
  revalidatePath("/", "layout");

  return updated.length > 0
    ? { status: "saved", message: adminLabels.settings.saved }
    : { status: "error", message: adminLabels.settings.saveFailed };
}