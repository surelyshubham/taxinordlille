import "server-only";

import { getDb } from "@/lib/db";
import { notificationLogs } from "@/lib/db/schema";
import type { ContactMessage, QuoteRequest } from "@/lib/db/schema";
import type { SiteSettings } from "@/lib/settings/schema";
import { formatDate } from "@/lib/utils";
import { localeTags } from "@/lib/i18n/config";
import {
  notifyBusinessOfContactMessage,
  notifyBusinessOfQuote,
  notifyCustomerOfQuote,
  type QuoteNotificationInput,
} from "./email";
import { sendWhatsAppAlert } from "./whatsapp";
import { maskRecipient, type NotifyResult } from "./types";

/**
 * Notification fan-out.
 *
 * Contract:
 *  - The enquiry is already committed to Postgres before this runs.
 *  - Every attempt is written to `notification_logs`, whatever the outcome.
 *  - No failure here can delete, invalidate or roll back the enquiry, and the
 *    function never throws.
 */

export type NotificationSummary = {
  emailBusiness: NotifyResult;
  emailCustomer: NotifyResult | null;
  whatsapp: NotifyResult;
  /** True when at least one channel actually reached the business. */
  businessReached: boolean;
};

const SERVICE_LABELS: Record<string, { fr: string; en: string }> = {
  gare: { fr: "Taxi gare", en: "Station taxi" },
  aeroport: { fr: "Transfert aéroport", en: "Airport transfer" },
  longue_distance: { fr: "Trajets longue distance", en: "Long-distance journeys" },
};

function serviceLabel(serviceType: string, locale: "fr" | "en"): string {
  return SERVICE_LABELS[serviceType]?.[locale] ?? serviceType;
}

function departureLabel(
  departureAt: Date,
  returnAt: Date | null,
  locale: "fr" | "en",
): string {
  const tag = localeTags[locale];
  const base = formatDate(departureAt, tag, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!returnAt) return base;
  return `${base} → ${formatDate(returnAt, tag, {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

async function logAttempt(entry: {
  quoteRequestId?: string;
  contactMessageId?: string;
  channel: "email" | "whatsapp";
  target: "business" | "client";
  result: NotifyResult;
  recipient: string;
  attempt?: number;
}): Promise<void> {
  try {
    await getDb().insert(notificationLogs).values({
      quoteRequestId: entry.quoteRequestId,
      contactMessageId: entry.contactMessageId,
      channel: entry.channel,
      target: entry.target,
      status: entry.result.status,
      recipient: maskRecipient(entry.recipient) || null,
      providerMessageId:
        entry.result.status === "envoye"
          ? (entry.result.providerMessageId ?? null)
          : null,
      errorDetail:
        entry.result.status === "envoye" ? null : entry.result.reason,
      attempt: entry.attempt ?? 1,
    });
  } catch (error) {
    // Losing a log line must never surface to the visitor.
    console.error("[notifications] failed to write notification log:", error);
  }
}

/** Dispatch every notification for a freshly saved quote request. */
export async function notifyEnquirySaved(
  enquiry: QuoteRequest,
  settings: SiteSettings,
  siteUrl: string,
): Promise<NotificationSummary> {
  const locale = enquiry.locale === "en" ? "en" : "fr";
  const adminUrl = `${siteUrl}/admin/demandes/${enquiry.id}`;

  const departure = departureLabel(
    enquiry.departureAt,
    enquiry.returnAt,
    locale,
  );

  const payload: QuoteNotificationInput = {
    reference: enquiry.reference,
    adminUrl,
    siteUrl,
    locale,
    fullName: enquiry.fullName,
    phone: enquiry.phone,
    email: enquiry.email,
    serviceTypeLabel: serviceLabel(enquiry.serviceType, locale),
    pickupAddress: enquiry.pickupAddress,
    destinationAddress: enquiry.destinationAddress,
    departureLabel: departure,
    returnLabel: enquiry.returnAt ? departure : null,
    passengers: enquiry.passengers,
    flightOrTrainNumber: enquiry.flightOrTrainNumber,
    luggageNotes: enquiry.luggageNotes,
    message: enquiry.message,
    company: enquiry.company,
  };

  const recipients = {
    from: settings.notifications.emailFrom || settings.notifications.emailTo,
    to: settings.notifications.emailTo,
  };

  const [emailBusiness, whatsapp] = await Promise.all([
    notifyBusinessOfQuote(payload, recipients).catch(
      (error): NotifyResult => ({
        status: "echec",
        reason: error instanceof Error ? error.message : String(error),
      }),
    ),
    sendWhatsAppAlert({
      reference: enquiry.reference,
      adminUrl,
      locale,
      fullName: enquiry.fullName,
      phone: enquiry.phone,
      pickupAddress: enquiry.pickupAddress,
      destinationAddress: enquiry.destinationAddress,
      departureLabel: departure,
      passengers: enquiry.passengers,
      serviceTypeLabel: serviceLabel(enquiry.serviceType, locale),
    }).catch(
      (error): NotifyResult => ({
        status: "echec",
        reason: error instanceof Error ? error.message : String(error),
      }),
    ),
  ]);

  await logAttempt({
    quoteRequestId: enquiry.id,
    channel: "email",
    target: "business",
    result: emailBusiness,
    recipient: recipients.to,
  });

  await logAttempt({
    quoteRequestId: enquiry.id,
    channel: "whatsapp",
    target: "business",
    result: whatsapp,
    recipient: process.env.WHATSAPP_BUSINESS_RECIPIENT ?? "",
  });

  // Courtesy acknowledgement only when the customer actually left an address.
  let emailCustomer: NotifyResult | null = null;
  if (enquiry.email && settings.notifications.sendCustomerAcknowledgement) {
    emailCustomer = await notifyCustomerOfQuote(payload, {
      from: recipients.from,
      to: enquiry.email,
    }).catch(
      (error): NotifyResult => ({
        status: "echec",
        reason: error instanceof Error ? error.message : String(error),
      }),
    );

    await logAttempt({
      quoteRequestId: enquiry.id,
      channel: "email",
      target: "client",
      result: emailCustomer,
      recipient: enquiry.email,
    });
  }

  if (emailBusiness.status !== "envoye" || whatsapp.status !== "envoye") {
    console.warn(
      `[notifications] enquiry ${enquiry.reference}: email=${emailBusiness.status} whatsapp=${whatsapp.status}`,
    );
  }

  return {
    emailBusiness,
    emailCustomer,
    whatsapp,
    businessReached:
      emailBusiness.status === "envoye" || whatsapp.status === "envoye",
  };
}

/** Dispatch notifications for a general contact message. */
export async function notifyContactSaved(
  message: ContactMessage,
  settings: SiteSettings,
  siteUrl: string,
): Promise<NotificationSummary> {
  const locale = message.locale === "en" ? "en" : "fr";
  const adminUrl = `${siteUrl}/admin/demandes?type=contact`;

  const emailBusiness = await notifyBusinessOfContactMessage(
    {
      fullName: message.fullName,
      email: message.email,
      phone: message.phone,
      subject: message.subject,
      message: message.message,
      adminUrl,
      siteUrl,
    },
    {
      from: settings.notifications.emailFrom || settings.notifications.emailTo,
      to: settings.notifications.emailTo,
    },
  ).catch(
    (error): NotifyResult => ({
      status: "echec",
      reason: error instanceof Error ? error.message : String(error),
    }),
  );

  await logAttempt({
    contactMessageId: message.id,
    channel: "email",
    target: "business",
    result: emailBusiness,
    recipient: settings.notifications.emailTo,
  });

  const whatsapp =
    settings.whatsappNumber && message.phone
      ? await sendWhatsAppAlert({
          reference: message.subject,
          adminUrl,
          locale,
          fullName: message.fullName,
          phone: message.phone,
          pickupAddress: message.email ?? "(e-mail)",
          destinationAddress: message.message.slice(0, 120),
          departureLabel: "—",
          passengers: 1,
          serviceTypeLabel: "Message de contact",
        }).catch(
          (error): NotifyResult => ({
            status: "echec",
            reason: error instanceof Error ? error.message : String(error),
          }),
        )
      : ({ status: "non_configure", reason: "contact direct" } as const);

  await logAttempt({
    contactMessageId: message.id,
    channel: "whatsapp",
    target: "business",
    result: whatsapp,
    recipient: settings.whatsappNumber,
  });

  return {
    emailBusiness,
    emailCustomer: null,
    whatsapp,
    businessReached:
      emailBusiness.status === "envoye" || whatsapp.status === "envoye",
  };
}