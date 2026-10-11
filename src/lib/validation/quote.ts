import { z } from "zod";

import { fromLocalInputValue, todayInputValue } from "@/lib/utils";

export const SERVICE_TYPES = ["gare", "aeroport", "longue_distance"] as const;

/** An optional email: empty string is valid, anything else must parse. */
const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === "" || z.email().safeParse(value).success);

/**
 * Field names double as keys into the `quote.errors` dictionary, and
 * `superRefine` issues are raised against the same keys — so one map drives
 * both client-side and server-side French messages.
 *
 * Note: no `.default()` and no `z.coerce` here. Defaults and string coercion
 * happen in `normaliseQuoteInput`, which keeps the schema's *input* and
 * *output* types identical so React Hook Form's resolver stays type-clean.
 */
export const quoteRequestSchema = z
  .object({
    fullName: z.string().trim().min(2, "").max(120, ""),
    phone: z
      .string()
      .trim()
      .min(1, "")
      .max(30, "")
      .refine((value) => /^[0-9+()\s.-]+$/.test(value), "")
      .refine((value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15;
      }, ""),

    email: optionalEmail,

    serviceType: z.enum(SERVICE_TYPES),

    pickupAddress: z.string().trim().min(3, "").max(250, ""),
    destinationAddress: z.string().trim().min(3, "").max(250, ""),

    /** `<input type="date">` and `<input type="time">` values, Europe/Paris. */
    departureDate: z.string().trim().min(1, ""),
    departureTime: z.string().trim().regex(/^\d{2}:\d{2}$/, ""),

    returnJourney: z.boolean(),
    returnDate: z.string().trim(),
    returnTime: z.string().trim(),

    passengers: z.number().int().min(1, "").max(30, ""),

    flightOrTrainNumber: z.string().trim().max(60, ""),
    luggageNotes: z.string().trim().max(1000, ""),
    message: z.string().trim().max(2000, ""),
    company: z.string().trim().max(160, ""),
    billingReference: z.string().trim().max(250, ""),

    consent: z.boolean().refine((value) => value === true, ""),

    /** Honeypot — must stay empty. Never rendered to a human. */
    website: z.string().max(200, ""),
  })
  .superRefine((value, ctx) => {
    const fail = (path: string) =>
      ctx.addIssue({ code: "custom", path: [path], message: "" });

    const today = todayInputValue();

    if (value.departureDate && value.departureDate < today) {
      fail("departureDate");
    }

    if (value.returnJourney && value.returnDate && value.returnDate < today) {
      fail("returnDate");
    }

    const departure = fromLocalInputValue(
      `${value.departureDate}T${value.departureTime}`,
    );
    const ret = value.returnJourney
      ? fromLocalInputValue(`${value.returnDate}T${value.returnTime}`)
      : null;

    if (value.returnJourney) {
      if (!value.returnDate) fail("returnDate");
      if (!value.returnTime || !/^\d{2}:\d{2}$/.test(value.returnTime)) {
        fail("returnTime");
      }
    }

    if (
      value.returnJourney &&
      departure &&
      ret &&
      ret.getTime() <= departure.getTime()
    ) {
      fail("returnBeforeDeparture");
    }

    if (
      value.pickupAddress.trim().toLowerCase() ===
      value.destinationAddress.trim().toLowerCase()
    ) {
      fail("addressSame");
    }
  });

export type QuoteRequestValues = z.infer<typeof quoteRequestSchema>;

/** Dictionary error keys this form can produce. */
export type QuoteErrorKey =
  | "fullName"
  | "phone"
  | "phoneShort"
  | "email"
  | "pickupAddress"
  | "destinationAddress"
  | "addressSame"
  | "departureDate"
  | "departureDatePast"
  | "departureTime"
  | "passengers"
  | "serviceType"
  | "returnDate"
  | "returnDatePast"
  | "returnTime"
  | "returnBeforeDeparture"
  | "consent"
  | "tooManyRequests"
  | "generic";

const FIELD_ERROR_MAP: Record<string, QuoteErrorKey> = {
  fullName: "fullName",
  phone: "phone",
  email: "email",
  pickupAddress: "pickupAddress",
  destinationAddress: "destinationAddress",
  addressSame: "addressSame",
  departureDate: "departureDate",
  departureTime: "departureTime",
  passengers: "passengers",
  serviceType: "serviceType",
  returnDate: "returnDate",
  returnTime: "returnTime",
  returnBeforeDeparture: "returnBeforeDeparture",
  consent: "consent",
  website: "generic",
};

/**
 * Collapse a ZodError into `{ fieldName: dictionaryKey }`.
 * The client renders `dict.quote.errors[key]` directly.
 */
export function mapQuoteIssues(
  error: z.ZodError,
): Record<string, QuoteErrorKey> {
  const result: Record<string, QuoteErrorKey> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;

    // A past date is a more useful message than "field required".
    if (field === "departureDate" && issue.code === "custom") {
      result[field] = "departureDatePast";
      continue;
    }
    if (field === "returnDate" && issue.code === "custom") {
      result[field] = "returnDatePast";
      continue;
    }
    if (field === "phone" && issue.code === "custom") {
      result[field] = "phoneShort";
      continue;
    }

    if (!result[field]) {
      result[field] = FIELD_ERROR_MAP[field] ?? "generic";
    }
  }

  return result;
}

/**
 * Convert a raw `FormData` payload into the exact shape the schema expects:
 * strings stay strings, `passengers` becomes a number, and the checkbox flags
 * become real booleans.
 */
export function normaliseQuoteInput(
  raw: Record<string, FormDataEntryValue | null>,
): QuoteRequestValues {
  const text = (key: string, fallback = ""): string => {
    const value = raw[key];
    return typeof value === "string" ? value : fallback;
  };

  const passengersRaw = Number.parseInt(text("passengers"), 10);

  return {
    fullName: text("fullName"),
    phone: text("phone"),
    email: text("email"),
    serviceType: text("serviceType", "gare") as QuoteRequestValues["serviceType"],
    pickupAddress: text("pickupAddress"),
    destinationAddress: text("destinationAddress"),
    departureDate: text("departureDate"),
    departureTime: text("departureTime"),
    returnJourney: text("returnJourney") === "true",
    returnDate: text("returnDate"),
    returnTime: text("returnTime"),
    passengers: Number.isFinite(passengersRaw) ? passengersRaw : Number.NaN,
    flightOrTrainNumber: text("flightOrTrainNumber"),
    luggageNotes: text("luggageNotes"),
    message: text("message"),
    company: text("company"),
    billingReference: text("billingReference"),
    consent: text("consent") === "true",
    website: text("website"),
  };
}

/** Convert validated strings into the `Date`s stored as UTC. */
export function toStoredDates(values: QuoteRequestValues): {
  departureAt: Date | null;
  returnAt: Date | null;
} {
  const departureAt = fromLocalInputValue(
    `${values.departureDate}T${values.departureTime}`,
  );
  const returnAt =
    values.returnJourney && values.returnDate && values.returnTime
      ? fromLocalInputValue(`${values.returnDate}T${values.returnTime}`)
      : null;

  return { departureAt, returnAt };
}