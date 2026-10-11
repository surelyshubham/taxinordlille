import "server-only";

import { sanitiseError, type NotifyResult } from "./types";

/**
 * WhatsApp Business Cloud API integration.
 *
 * Credentials live only on the server. When they are absent the function
 * returns `non_configure` — the enquiry is still stored and the public site
 * still offers the manual `wa.me` button with a prefilled message. We never
 * report a message as sent unless the API confirmed it.
 */

type WhatsAppConfig = {
  token: string;
  phoneNumberId: string;
  recipient: string;
};

function readConfig(): WhatsAppConfig | null {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient =
    process.env.WHATSAPP_BUSINESS_RECIPIENT?.replace(/\D/g, "") ?? "";

  if (!token || !phoneNumberId || !recipient) return null;
  return { token, phoneNumberId, recipient };
}

export type WhatsAppAlertInput = {
  reference: string;
  adminUrl: string;
  locale: "fr" | "en";
  fullName: string;
  phone: string;
  pickupAddress: string;
  destinationAddress: string;
  departureLabel: string;
  passengers: number;
  serviceTypeLabel: string;
};

/**
 * Send a short operational alert to the business number.
 * Kept terse on purpose: WhatsApp is a nudge, the admin panel is the record.
 */
function renderAlert(input: WhatsAppAlertInput): string {
  const isFr = input.locale === "fr";
  const lines = isFr
    ? [
        `🚕 *Nouvelle demande ${input.reference}*`,
        ``,
        `${input.serviceTypeLabel}`,
        `📍 ${input.pickupAddress}`,
        `🎯 ${input.destinationAddress}`,
        `🕐 ${input.departureLabel}`,
        `👥 ${input.passengers}`,
        ``,
        `📞 ${input.phone}`,
        ``,
        `Voir le détail : ${input.adminUrl}`,
      ]
    : [
        `🚕 *New request ${input.reference}*`,
        ``,
        `${input.serviceTypeLabel}`,
        `📍 ${input.pickupAddress}`,
        `🎯 ${input.destinationAddress}`,
        `🕐 ${input.departureLabel}`,
        `👥 ${input.passengers}`,
        ``,
        `📞 ${input.phone}`,
        ``,
        `View details: ${input.adminUrl}`,
      ];

  return lines.join("\n");
}

export async function sendWhatsAppAlert(
  input: WhatsAppAlertInput,
): Promise<NotifyResult> {
  const config = readConfig();

  if (!config) {
    return {
      status: "non_configure",
      reason:
        "WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_BUSINESS_RECIPIENT non renseignés",
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: config.recipient,
          type: "text",
          text: {
            preview_url: true,
            body: renderAlert(input),
          },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        status: "echec",
        reason: sanitiseError(
          `HTTP ${response.status}: ${detail.slice(0, 200)}`,
        ),
      };
    }

    const payload = (await response.json().catch(() => null)) as {
      messages?: { id?: string }[];
    } | null;

    return {
      status: "envoye",
      providerMessageId: payload?.messages?.[0]?.id,
    };
  } catch (error) {
    return { status: "echec", reason: sanitiseError(error) };
  }
}