import "server-only";

import { Resend } from "resend";

import {
  maskRecipient,
  sanitiseError,
  type NotifyResult,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

const INK = "#0b0a08";
const GOLD = "#d4b668";
const GOLD_SOFT = "#f0dfb4";
const TEXT = "#d8c394";
const MUTED = "#94835a";
const LINE = "#2c2619";

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="max-width:620px;background:#12100c;border:1px solid ${LINE};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid ${LINE};">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;letter-spacing:0.18em;text-transform:uppercase;color:${GOLD_SOFT};">
                  Taxi Nord Lille
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:500;color:${GOLD_SOFT};">${title}</h1>
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const row = (label: string, value: string): string => `
  <tr>
    <td style="padding:9px 16px 9px 0;border-bottom:1px solid ${LINE};color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:9px 0;border-bottom:1px solid ${LINE};color:${TEXT};font-size:14px;word-break:break-word;">${value}</td>
  </tr>`;

const button = (href: string, label: string): string => `
  <tr>
    <td style="padding:26px 0 6px;">
      <a href="${href}" style="display:inline-block;background:${GOLD};color:${INK};text-decoration:none;font-weight:700;font-size:14px;padding:13px 24px;border-radius:10px;">
        ${label}
      </a>
    </td>
  </tr>`;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export type QuoteNotificationInput = {
  reference: string;
  adminUrl: string;
  siteUrl: string;
  locale: "fr" | "en";
  fullName: string;
  phone: string;
  email: string | null;
  serviceTypeLabel: string;
  pickupAddress: string;
  destinationAddress: string;
  departureLabel: string;
  returnLabel: string | null;
  passengers: number;
  flightOrTrainNumber: string | null;
  luggageNotes: string | null;
  message: string | null;
  company: string | null;
};

function renderQuoteEmail(input: QuoteNotificationInput): string {
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Référence", `<strong style="color:${GOLD};">${escapeHtml(input.reference)}</strong>`)}
      ${row("Client", escapeHtml(input.fullName))}
      ${row("Téléphone", `<a href="tel:${escapeHtml(input.phone)}" style="color:${GOLD};text-decoration:none;">${escapeHtml(input.phone)}</a>`)}
      ${input.email ? row("E-mail", `<a href="mailto:${escapeHtml(input.email)}" style="color:${GOLD};text-decoration:none;">${escapeHtml(input.email)}</a>`) : ""}
      ${row("Service", escapeHtml(input.serviceTypeLabel))}
      ${row("Départ", escapeHtml(input.pickupAddress))}
      ${row("Destination", escapeHtml(input.destinationAddress))}
      ${row("Date et heure", escapeHtml(input.departureLabel))}
      ${input.returnLabel ? row("Retour", escapeHtml(input.returnLabel)) : ""}
      ${row("Passagers", String(input.passengers))}
      ${input.flightOrTrainNumber ? row("Vol / train", escapeHtml(input.flightOrTrainNumber)) : ""}
      ${input.company ? row("Société", escapeHtml(input.company)) : ""}
      ${input.luggageNotes ? row("Bagages", escapeHtml(input.luggageNotes)) : ""}
      ${input.message ? row("Message", escapeHtml(input.message)) : ""}
    </table>
    ${button(input.adminUrl, "Ouvrir la demande")}
    <tr><td style="padding-top:22px;color:${MUTED};font-size:12px;line-height:1.6;">
      Cette demande n'est pas une réservation confirmée. Le trajet doit être confirmé avec le client.
    </td></tr>`;

  return shell("Nouvelle demande de devis", body);
}

/**
 * Customer acknowledgement.
 *
 * States only that the request was received. It never quotes a price, never
 * implies the journey is booked, and does not promise a response time.
 */
function renderAcknowledgementEmail(
  input: QuoteNotificationInput,
): string {
  const isFr = input.locale === "fr";
  const heading = isFr
    ? "Votre demande a bien été reçue"
    : "We have received your request";
  const intro = isFr
    ? `Bonjour ${input.fullName}, nous avons bien enregistré votre demande de devis.`
    : `Hello ${input.fullName}, we have received your quote request.`;
  const next = isFr
    ? "L'exploitant vous contactera pour vous communiquer le tarif et les détails du trajet."
    : "The operator will contact you with the price and the details of your journey.";
  const caveat = isFr
    ? "Votre trajet n'est pas encore confirmé : aucun tarif n'est validé tant que nous n'en avons pas discuté avec vous."
    : "Your journey is not confirmed yet: no price is agreed until we have discussed it with you.";
  const referenceLine = isFr
    ? `Référence : <strong style="color:${GOLD};">${escapeHtml(input.reference)}</strong>`
    : `Reference: <strong style="color:${GOLD};">${escapeHtml(input.reference)}</strong>`;
  const callLine = isFr
    ? `Une question en attendant ? Appelez-nous au <a href="tel:${escapeHtml(input.phone)}" style="color:${GOLD};">${escapeHtml(input.phone)}</a>.`
    : `Any questions in the meantime? Call us on <a href="tel:${escapeHtml(input.phone)}" style="color:${GOLD};">${escapeHtml(input.phone)}</a>.`;

  const body = `
    <p style="margin:0 0 16px;color:${TEXT};font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>
    <p style="margin:0 0 22px;color:${TEXT};font-size:15px;line-height:1.7;">${next}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0a08;border:1px solid ${LINE};border-radius:12px;padding:16px 20px;">
      <tr><td style="color:${MUTED};font-size:13px;">${referenceLine}</td></tr>
      <tr><td style="padding-top:6px;color:${GOLD_SOFT};font-size:14px;">
        ${escapeHtml(input.pickupAddress)} → ${escapeHtml(input.destinationAddress)}<br />
        ${escapeHtml(input.departureLabel)}
      </td></tr>
    </table>
    ${button(input.siteUrl, isFr ? "Consulter nos services" : "View our services")}
    <tr><td style="padding-top:22px;color:${MUTED};font-size:12px;line-height:1.6;">
      ${escapeHtml(caveat)}
    </td></tr>
    <tr><td style="padding-top:10px;color:${MUTED};font-size:12px;line-height:1.6;">
      ${callLine}
    </td></tr>`;

  return shell(heading, body);
}

function renderContactEmail(input: {
  fullName: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  adminUrl: string;
  siteUrl: string;
}): string {
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Objet", escapeHtml(input.subject))}
      ${row("Nom", escapeHtml(input.fullName))}
      ${input.email ? row("E-mail", `<a href="mailto:${escapeHtml(input.email)}" style="color:${GOLD};text-decoration:none;">${escapeHtml(input.email)}</a>`) : ""}
      ${input.phone ? row("Téléphone", escapeHtml(input.phone)) : ""}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#0b0a08;border:1px solid ${LINE};border-radius:12px;">
      <tr><td style="padding:18px 20px;color:${TEXT};font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(input.message)}</td></tr>
    </table>
    ${button(input.adminUrl, "Ouvrir le message")}`;

  return shell("Nouveau message de contact", body);
}

/* -------------------------------------------------------------------------- */
/* Transport                                                                   */
/* -------------------------------------------------------------------------- */

function isConfigured(from: string, to: string): boolean {
  return Boolean(from && to && process.env.RESEND_API_KEY);
}

async function send(input: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<NotifyResult> {
  try {
    const client = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await client.emails.send({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      return { status: "echec", reason: sanitiseError(error) };
    }

    return { status: "envoye", providerMessageId: data?.id };
  } catch (error) {
    return { status: "echec", reason: sanitiseError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export async function notifyBusinessOfQuote(
  input: QuoteNotificationInput,
  recipients: { from: string; to: string },
): Promise<NotifyResult> {
  if (!isConfigured(recipients.from, recipients.to)) {
    return {
      status: "non_configure",
      reason: recipients.from
        ? "RESEND_API_KEY manquant"
        : "notifications.emailTo non renseigné",
    };
  }

  return send({
    from: recipients.from,
    to: recipients.to,
    subject: `[${input.reference}] Devis taxi — ${input.fullName}`,
    html: renderQuoteEmail(input),
  });
}

export async function notifyCustomerOfQuote(
  input: QuoteNotificationInput,
  recipients: { from: string; to: string },
): Promise<NotifyResult> {
  if (!isConfigured(recipients.from, recipients.to)) {
    return {
      status: "non_configure",
      reason: recipients.from
        ? "RESEND_API_KEY manquant"
        : "notifications.emailFrom non renseigné",
    };
  }

  return send({
    from: recipients.from,
    to: recipients.to,
    subject:
      input.locale === "fr"
        ? `Votre demande ${input.reference} a bien été reçue`
        : `We received your request ${input.reference}`,
    html: renderAcknowledgementEmail(input),
  });
}

export async function notifyBusinessOfContactMessage(
  input: {
    fullName: string;
    email: string | null;
    phone: string | null;
    subject: string;
    message: string;
    adminUrl: string;
    siteUrl: string;
  },
  recipients: { from: string; to: string },
): Promise<NotifyResult> {
  if (!isConfigured(recipients.from, recipients.to)) {
    return {
      status: "non_configure",
      reason: recipients.from
        ? "RESEND_API_KEY manquant"
        : "notifications.emailTo non renseigné",
    };
  }

  return send({
    from: recipients.from,
    to: recipients.to,
    subject: `[Contact] ${input.subject} — ${input.fullName}`,
    html: renderContactEmail(input),
  });
}

export { maskRecipient };