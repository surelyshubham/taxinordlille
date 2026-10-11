"use server";

import { and, eq } from "drizzle-orm";

import { getClientIp } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { notifyContactSaved } from "@/lib/notifications";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getSiteSettings, getSiteUrl } from "@/lib/settings";
import {
  contactMessageSchema,
  mapContactIssues,
  normaliseContactInput,
  type ContactErrorKey,
} from "@/lib/validation/contact";

export type ContactActionResult =
  | { status: "success"; businessNotified: boolean }
  | {
      status: "error";
      errors?: Record<string, ContactErrorKey>;
      formError?: ContactErrorKey;
    };

export async function submitContactMessage(
  formData: FormData,
): Promise<ContactActionResult> {
  const ip = await getClientIp();

  const limit = await consumeRateLimit(
    `contact:${ip}`,
    RATE_LIMITS.contactMessage.limit,
    RATE_LIMITS.contactMessage.windowSeconds,
  );
  if (!limit.ok) return { status: "error", formError: "generic" };

  const raw = normaliseContactInput(Object.fromEntries(formData.entries()));

  // Honeypot.
  if (raw.website.trim() !== "") {
    return { status: "success", businessNotified: false };
  }

  const parsed = contactMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", errors: mapContactIssues(parsed.error) };
  }

  const locale = isLocale(formData.get("locale") as string)
    ? (formData.get("locale") as "fr" | "en")
    : defaultLocale;

  let message;
  try {
    const [row] = await getDb()
      .insert(contactMessages)
      .values({
        fullName: parsed.data.fullName,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
        locale,
      })
      .returning();

    if (!row) throw new Error("insert returned no row");
    message = row;
  } catch (error) {
    console.error("[contact] failed to store message:", error);
    return { status: "error", formError: "generic" };
  }

  const settings = await getSiteSettings();
  const summary = await notifyContactSaved(message, settings, getSiteUrl());

  return { status: "success", businessNotified: summary.businessReached };
}

/** Admin-only: update the processing status of a contact message. */
export async function updateContactStatus(
  id: string,
  status: "nouveau" | "traite" | "cloture",
): Promise<{ ok: boolean }> {
  const { requireAdminAction } = await import("@/lib/auth/session");
  await requireAdminAction();

  const updated = await getDb()
    .update(contactMessages)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(contactMessages.id, id)))
    .returning({ id: contactMessages.id });

  return { ok: updated.length > 0 };
}