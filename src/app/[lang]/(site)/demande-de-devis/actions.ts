"use server";

import { and, eq, gte, or } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { quoteRequests, type QuoteRequest } from "@/lib/db/schema";
import { generateEnquiryReference } from "@/lib/enquiries/reference";
import { getClientIp } from "@/lib/auth/session";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { notifyEnquirySaved } from "@/lib/notifications";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getSiteSettings, getSiteUrl } from "@/lib/settings";
import {
  mapQuoteIssues,
  normaliseQuoteInput,
  quoteRequestSchema,
  toStoredDates,
  type QuoteErrorKey,
  type QuoteRequestValues,
} from "@/lib/validation/quote";

export type QuoteActionResult =
  | {
      status: "success";
      reference: string;
      /** Confirms to the admin UI whether any channel actually delivered. */
      businessNotified: boolean;
    }
  | {
      status: "error";
      errors?: Record<string, QuoteErrorKey>;
      /** Form-level problem (rate limit, storage failure). */
      formError?: QuoteErrorKey;
    };

/**
 * Public quote submission.
 *
 * Order of operations matters and is deliberate:
 *   1. rate limit
 *   2. honeypot (silently accept, store nothing)
 *   3. validate
 *   4. persist to Postgres  ← the request exists from here on
 *   5. notify (failures recorded, never fatal)
 *
 * Nothing after step 4 can fail the submission.
 */
export async function submitQuoteRequest(
  formData: FormData,
): Promise<QuoteActionResult> {
  const ip = await getClientIp();

  const limit = await consumeRateLimit(
    `quote:${ip}`,
    RATE_LIMITS.quoteRequest.limit,
    RATE_LIMITS.quoteRequest.windowSeconds,
  );
  if (!limit.ok) {
    return { status: "error", formError: "tooManyRequests" };
  }

  const raw = normaliseQuoteInput(
    Object.fromEntries(formData.entries()),
  ) as QuoteRequestValues & { locale: string };

  // Honeypot: a bot filled a field no human can see. Report success so the bot
  // learns nothing, but do not store anything.
  if (raw.website.trim() !== "") {
    return {
      status: "success",
      reference: "TNL-000000-0000",
      businessNotified: false,
    };
  }

  const parsed = quoteRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", errors: mapQuoteIssues(parsed.error) };
  }

  const values = parsed.data;
  const { departureAt, returnAt } = toStoredDates(values);

  if (!departureAt || Number.isNaN(departureAt.getTime())) {
    return { status: "error", errors: { departureDate: "departureDate" } };
  }

  const locale = isLocale(raw.locale) ? raw.locale : defaultLocale;

  // Sensible duplicate handling: the same person, same trip, submitted twice
  // within a short window, is almost certainly a double-click or a retry after
  // a flaky connection. Return the original reference instead of creating a
  // duplicate the operator would have to reconcile by hand.
  const duplicate = await findRecentDuplicate({
    phone: values.phone,
    pickupAddress: values.pickupAddress,
    departureAt,
  });

  if (duplicate) {
    return {
      status: "success",
      reference: duplicate.reference,
      businessNotified: true,
    };
  }

  let enquiry: QuoteRequest;
  try {
    enquiry = await insertEnquiry({
      values,
      departureAt,
      returnAt,
      locale,
    });
  } catch (error) {
    console.error("[quote] failed to store enquiry:", error);
    return { status: "error", formError: "generic" };
  }

  // --- From here the enquiry is safely stored. Notifications cannot undo it. ---
  const settings = await getSiteSettings();
  const summary = await notifyEnquirySaved(enquiry, settings, getSiteUrl());

  return {
    status: "success",
    reference: enquiry.reference,
    businessNotified: summary.businessReached,
  };
}

async function findRecentDuplicate(input: {
  phone: string;
  pickupAddress: string;
  departureAt: Date;
}): Promise<QuoteRequest | null> {
  // Normalise the phone to its digits so "+33 6..." and "06..." match.
  const digits = input.phone.replace(/\D/g, "");
  const national =
    digits.startsWith("33") && digits.length === 11
      ? `0${digits.slice(2)}`
      : digits;

  const windowStart = new Date(Date.now() - 5 * 60 * 1000);

  const rows = await getDb()
    .select()
    .from(quoteRequests)
    .where(
      and(
        gte(quoteRequests.createdAt, windowStart),
        eq(quoteRequests.departureAt, input.departureAt),
        or(
          eq(quoteRequests.phone, input.phone),
          eq(quoteRequests.phone, national),
        ),
        eq(quoteRequests.pickupAddress, input.pickupAddress),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

async function insertEnquiry(input: {
  values: QuoteRequestValues;
  departureAt: Date;
  returnAt: Date | null;
  locale: "fr" | "en";
}): Promise<QuoteRequest> {
  const { values } = input;

  // Reference has a unique index; retry rather than surfacing a constraint
  // error to the customer.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const reference = await generateEnquiryReference();
    try {
      const [row] = await getDb()
        .insert(quoteRequests)
        .values({
          reference,
          serviceType: values.serviceType,
          fullName: values.fullName,
          phone: values.phone,
          email: values.email || null,
          company: values.company || null,
          locale: input.locale,
          pickupAddress: values.pickupAddress,
          destinationAddress: values.destinationAddress,
          departureAt: input.departureAt,
          returnAt: input.returnAt,
          passengers: values.passengers,
          flightOrTrainNumber: values.flightOrTrainNumber || null,
          luggageNotes: values.luggageNotes || null,
          message: values.message || null,
          billingReference: values.billingReference || null,
          consentGivenAt: new Date(),
          consentVersion: "v1",
        })
        .returning();

      if (row) return row;
    } catch (error) {
      const isReferenceConflict =
        error instanceof Error &&
        (error.message.includes("quote_requests_reference_idx") ||
          error.message.includes("duplicate key"));

      if (!isReferenceConflict) throw error;
    }
  }

  throw new Error("Could not allocate a unique enquiry reference");
}