import { z } from "zod";

/**
 * Structured, validated representation of everything the owner can configure
 * from the admin panel without touching code.
 *
 * Placeholder values below are what ships by default. The admin panel compares
 * live values against `PLACEHOLDER_VALUES` and surfaces anything still holding
 * a placeholder, so the owner knows exactly what must be confirmed before launch.
 */

const optionalText = z.string().trim().max(300).optional().default("");
const optionalEmail = z.union([z.email(), z.literal("")]).default("");
/** Accepts an absolute URL or a root-relative path such as `/brand/og.png`. */
const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || value.startsWith("/") || z.url().safeParse(value).success,
  )
  .optional()
  .default("");

export const socialLinksSchema = z.object({
  facebook: optionalUrl,
  instagram: optionalUrl,
  linkedin: optionalUrl,
  x: optionalUrl,
});

export const businessAddressSchema = z.object({
  street: z.string().trim().max(160).optional().default(""),
  postalCode: z.string().trim().max(12).optional().default(""),
  city: z.string().trim().max(80).optional().default("Lille"),
  country: z.string().trim().max(80).optional().default("France"),
});

export const seoSchema = z.object({
  defaultTitle: z.string().trim().min(1).max(70),
  defaultDescription: z.string().trim().min(1).max(180),
  ogImageUrl: optionalUrl,
  /** Used to build TaxiService / LocalBusiness structured data. */
  city: z.string().trim().max(80).optional().default("Lille"),
  postalCode: z.string().trim().max(12).optional().default("59000"),
  countryCode: z.string().trim().max(4).optional().default("FR"),
  latitude: z.string().trim().max(20).optional().default(""),
  longitude: z.string().trim().max(20).optional().default(""),
});

export const legalSchema = z.object({
  /** Company registration identifiers — left blank rather than invented. */
  legalName: z.string().trim().max(160).optional().default(""),
  siret: z.string().trim().max(20).optional().default(""),
  rcs: z.string().trim().max(40).optional().default(""),
  vatNumber: z.string().trim().max(20).optional().default(""),
  insuranceInsurer: z.string().trim().max(160).optional().default(""),
  hostingProvider: z.string().trim().max(160).optional().default(""),
  dataRetentionMonths: z.coerce.number().int().min(1).max(120).optional().default(24),
});

export const notificationSettingsSchema = z.object({
  /** Where new-enquiry notifications are delivered. */
  emailTo: z.union([z.email(), z.literal("")]).default(""),
  /** Verified sender used by the transactional email provider. */
  emailFrom: z.union([z.email(), z.literal("")]).default(""),
  /** Send a courtesy acknowledgement when the customer left an email address. */
  sendCustomerAcknowledgement: z.coerce.boolean().optional().default(true),
  /** WhatsApp recipient for automated business alerts, in E.164 without "+". */
  whatsappRecipient: z.string().trim().max(20).optional().default(""),
});

export const siteSettingsSchema = z.object({
  businessName: z.string().trim().min(1).max(80),
  tagline: optionalText,
  phone: z.string().trim().min(1).max(40),
  phoneDisplay: z.string().trim().max(40).optional().default(""),
  /** E.164 digits only, e.g. 33612345678. Empty disables the WhatsApp button. */
  whatsappNumber: z.string().trim().regex(/^\d{6,20}$|^$/).optional().default(""),
  email: optionalEmail,
  address: businessAddressSchema.optional().default(businessAddressSchema.parse({})),
  coverageArea: z.string().trim().max(400).optional().default(""),
  openingHours: z.string().trim().max(200).optional().default(""),
  social: socialLinksSchema.optional().default(socialLinksSchema.parse({})),
  seo: seoSchema,
  legal: legalSchema.optional().default(legalSchema.parse({})),
  notifications: notificationSettingsSchema.optional().default(
    notificationSettingsSchema.parse({}),
  ),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

/** Shipped defaults. Everything the owner must confirm is marked in the admin UI. */
export const DEFAULT_SETTINGS: SiteSettings = siteSettingsSchema.parse({
  businessName: "Taxi Nord Lille",
  tagline: "Transferts gare, aéroport et longue distance",
  phone: "+33 3 20 00 00 00",
  phoneDisplay: "03 20 00 00 00",
  whatsappNumber: "33320000000",
  email: "contact@taxinordlille.fr",
  address: {
    street: "",
    postalCode: "",
    city: "Lille",
    country: "France",
  },
  coverageArea: "Lille et son agglomération",
  openingHours: "",
  social: { facebook: "", instagram: "", linkedin: "", x: "" },
  seo: {
    defaultTitle: "Taxi à Lille — Transferts gare, aéroport et longue distance",
    defaultDescription:
      "Taxi à Lille : transferts gare, aéroport Lille-Lesquin et longues distances. Décrivez votre trajet et recevez un devis personnalisé.",
    ogImageUrl: "/brand/og-default.png",
    city: "Lille",
    postalCode: "59000",
    countryCode: "FR",
    latitude: "",
    longitude: "",
  },
  legal: {
    legalName: "",
    siret: "",
    rcs: "",
    vatNumber: "",
    insuranceInsurer: "",
    hostingProvider: "",
    dataRetentionMonths: 24,
  },
  notifications: {
    emailTo: "contact@taxinordlille.fr",
    emailFrom: "",
    sendCustomerAcknowledgement: true,
    whatsappRecipient: "",
  },
});

type FieldPath = string;

const PLACEHOLDER_VALUES: Record<FieldPath, string> = {
  businessName: DEFAULT_SETTINGS.businessName,
  phone: DEFAULT_SETTINGS.phone,
  phoneDisplay: DEFAULT_SETTINGS.phoneDisplay,
  whatsappNumber: DEFAULT_SETTINGS.whatsappNumber,
  email: DEFAULT_SETTINGS.email,
  "address.city": DEFAULT_SETTINGS.address.city,
  coverageArea: DEFAULT_SETTINGS.coverageArea,
  "seo.defaultTitle": DEFAULT_SETTINGS.seo.defaultTitle,
  "seo.defaultDescription": DEFAULT_SETTINGS.seo.defaultDescription,
  "seo.postalCode": DEFAULT_SETTINGS.seo.postalCode,
  "notifications.emailTo": DEFAULT_SETTINGS.notifications.emailTo,
};

const readPath = (source: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);

export function getPlaceholderValues(): Record<FieldPath, string> {
  return PLACEHOLDER_VALUES;
}

/**
 * Which configured fields are still holding their shipped placeholder.
 * Surfaced as a checklist in the admin panel before launch.
 */
export function getUnconfirmedFields(
  settings: SiteSettings,
): { field: string; placeholder: string; current: string }[] {
  const missing: { field: string; placeholder: string; current: string }[] = [];

  for (const [field, placeholder] of Object.entries(PLACEHOLDER_VALUES)) {
    const current = readPath(settings, field);
    if (typeof current !== "string") continue;
    if (current.trim() === "" || current.trim() === placeholder) {
      missing.push({ field, placeholder, current });
    }
  }

  return missing;
}

/** Normalise a user-entered phone number into E.164 digits. */
export function toE164(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^\d{6,20}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("33") && digits.length === 11 ? digits : `33${digits.slice(-9)}`;
}

/** Pretty display form, e.g. `+33 6 12 34 56 78`. */
export function formatPhoneDisplay(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("33") && digits.length === 11) {
    return `+33 ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return input;
}

/** `tel:` href for a phone number. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** `https://wa.me/…` href, optionally with a prefilled message. */
export function whatsappHref(number: string, message?: string): string {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}