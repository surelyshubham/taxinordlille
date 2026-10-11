"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { adminActivity, quoteRequests } from "@/lib/db/schema";
import { notifyEnquirySaved } from "@/lib/notifications";
import { getSiteSettings, getSiteUrl } from "@/lib/settings";
import { VALID_STATUSES } from "@/lib/admin/queries";

/**
 * Update the manual workflow status of an enquiry.
 *
 * The administrator moves an enquiry through the pipeline by hand. The site
 * never infers "quoted" or "confirmed" from a notification having been sent —
 * sending a notification says nothing about what the customer agreed to.
 */
export async function updateEnquiryStatusAction(
  id: string,
  status: string,
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireAdminAction();

  if (!VALID_STATUSES.includes(status as never)) {
    return { ok: false, message: "Statut invalide." };
  }

  const updated = await getDb()
    .update(quoteRequests)
    .set({ status: status as never, statusUpdatedAt: new Date(), updatedAt: new Date() })
    .where(eq(quoteRequests.id, id))
    .returning({ id: quoteRequests.id });

  if (updated.length === 0) return { ok: false, message: "Demande introuvable." };

  await getDb()
    .insert(adminActivity)
    .values({
      userId: user.id,
      action: "enquiry_status",
      entityType: "quote_request",
      entityId: id,
      detail: status,
    });

  revalidatePath("/admin/demandes");
  revalidatePath(`/admin/demandes/${id}`);
  revalidatePath("/admin");

  return { ok: true };
}

/** Private notes, visible only in the admin panel. */
export async function updateEnquiryNotesAction(
  id: string,
  notes: string,
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireAdminAction();
  const trimmed = notes.slice(0, 8000);

  const updated = await getDb()
    .update(quoteRequests)
    .set({ adminNotes: trimmed || null, updatedAt: new Date() })
    .where(eq(quoteRequests.id, id))
    .returning({ id: quoteRequests.id });

  if (updated.length === 0) return { ok: false, message: "Demande introuvable." };

  await getDb()
    .insert(adminActivity)
    .values({
      userId: user.id,
      action: "enquiry_notes",
      entityType: "quote_request",
      entityId: id,
    });

  revalidatePath(`/admin/demandes/${id}`);
  return { ok: true };
}

/** Permanently remove an enquiry. */
export async function deleteEnquiryAction(
  id: string,
): Promise<{ ok: boolean }> {
  await requireAdminAction();

  await getDb()
    .delete(quoteRequests)
    .where(and(eq(quoteRequests.id, id)));

  revalidatePath("/admin/demandes");
  redirect("/admin/demandes");
}

/**
 * Re-send the notifications for an enquiry.
 *
 * Useful when e-mail or WhatsApp credentials were added after a batch of
 * enquiries came in. The result is reported honestly: "not configured" is
 * never reported as "sent".
 */
export async function resendEnquiryNotifications(
  enquiryId: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdminAction();

  const rows = await getDb()
    .select()
    .from(quoteRequests)
    .where(eq(quoteRequests.id, enquiryId))
    .limit(1);

  const enquiry = rows[0];
  if (!enquiry) return { ok: false, message: "Demande introuvable." };

  const settings = await getSiteSettings();
  const summary = await notifyEnquirySaved(enquiry, settings, getSiteUrl());

  revalidatePath(`/admin/demandes/${enquiryId}`);

  if (!summary.businessReached) {
    const nothingConfigured =
      summary.emailBusiness.status === "non_configure" &&
      summary.whatsapp.status === "non_configure";

    return {
      ok: false,
      message: nothingConfigured
        ? "Aucune notification n'est configurée : renseignez RESEND_API_KEY, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID et WHATSAPP_BUSINESS_RECIPIENT."
        : "L'envoi a échoué. Consultez le journal des notifications pour le détail.",
    };
  }

  return { ok: true, message: "Notifications renvoyées." };
}