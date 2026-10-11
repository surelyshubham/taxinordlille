/**
 * Notification provider contracts.
 *
 * Every provider returns a discriminated result instead of throwing, so the
 * caller can record the exact outcome in `notification_logs` and tell the
 * truth in the admin UI.
 */

export type NotifyResult =
  | {
      status: "envoye";
      providerMessageId?: string;
    }
  | {
      status: "non_configure";
      /** Operator-facing reason, safe to store. Never contains credentials. */
      reason: string;
    }
  | {
      status: "echec";
      reason: string;
      providerMessageId?: string;
    };

export type NotificationContext = {
  /** Absolute URL of the enquiry in the admin panel. */
  adminUrl: string;
  /** Public site URL, for links inside customer-facing messages. */
  siteUrl: string;
  locale: "fr" | "en";
};

/**
 * Reduce an arbitrary provider error to a short, storable string.
 *
 * Strips anything that looks like a credential and truncates, so a provider
 * stack trace can never end up in the database or the admin UI verbatim.
 */
export function sanitiseError(error: unknown): string {
  let text: string;

  if (error instanceof Error) {
    text = `${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    text = error;
  } else {
    try {
      text = JSON.stringify(error);
    } catch {
      text = "Unknown error";
    }
  }

  return text
    // Redact anything key-shaped before it is persisted.
    .replace(/\b(api[-_]?key|token|secret|password|authorization)\b\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .replace(/\b[A-Za-z0-9_-]{24,}\b/g, (match) =>
      // Long opaque strings are almost always keys/tokens — but keep readable
      // identifiers such as message ids that start with a known prefix.
      match.includes("-") && match.length < 40 ? match : "[redacted]",
    )
    .slice(0, 400);
}

/** Human-readable label for a masked recipient, safe for logs. */
export function maskRecipient(value: string | null | undefined): string {
  if (!value) return "";
  const [local, domain] = value.includes("@")
    ? value.split("@")
    : [value, ""];
  if (domain) {
    const head = local.slice(0, 2);
    return `${head}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
  }
  return `***${value.replace(/\D/g, "").slice(-4)}`;
}