"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Mail, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { adminLabels } from "@/lib/admin/labels";

import {
  updateEnquiryNotesAction,
  updateEnquiryStatusAction,
} from "../actions";

/**
 * Status selector and private notes for one enquiry.
 * Both mutations are Server Actions that re-authorise independently.
 */
export function EnquiryControls({
  enquiryId,
  initialStatus,
  initialNotes,
  phone,
  email,
  customerName,
  reference,
  siteWhatsappMessage,
}: {
  enquiryId: string;
  initialStatus: string;
  initialNotes: string;
  phone: string;
  email: string | null;
  customerName: string;
  reference: string;
  siteWhatsappMessage: string;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState(initialStatus);
  const [notes, setNotes] = React.useState(initialNotes);
  const [savingStatus, setSavingStatus] = React.useState(false);
  const [savingNotes, setSavingNotes] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function onStatusChange(next: string) {
    const previous = status;
    setStatus(next);
    setSavingStatus(true);
    setMessage(null);

    const result = await updateEnquiryStatusAction(enquiryId, next);
    setSavingStatus(false);

    if (!result.ok) {
      setStatus(previous);
      setMessage(result.message ?? adminLabels.common.error);
      return;
    }

    setMessage(adminLabels.enquiries.statusChanged);
    router.refresh();
  }

  async function onSaveNotes() {
    setSavingNotes(true);
    setMessage(null);
    const result = await updateEnquiryNotesAction(enquiryId, notes);
    setSavingNotes(false);
    setMessage(result.ok ? adminLabels.enquiries.notesSaved : (result.message ?? adminLabels.common.error));
  }

  // The operator messages the *customer*, prefilled with the reference so the
  // conversation is traceable to the enquiry record.
  const waHref = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    siteWhatsappMessage.replace("{ref}", reference),
  )}`;

  return (
    <div className="space-y-6">
      {/* --- Contact actions --- */}
      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-500">
          {adminLabels.enquiries.customerDetails}
        </h2>
        <p className="mt-3 text-base text-content">{customerName}</p>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          <Button asChild variant="surface" className="justify-start">
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
              <Phone aria-hidden="true" />
              {adminLabels.enquiries.call}
            </a>
          </Button>

          {phone ? (
            <Button asChild variant="whatsapp" className="justify-start">
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden="true" />
                {adminLabels.enquiries.whatsapp}
              </a>
            </Button>
          ) : null}

          {email ? (
            <Button asChild variant="surface" className="justify-start">
              <a href={`mailto:${email}`}>
                <Mail aria-hidden="true" />
                {adminLabels.enquiries.emailCustomer}
              </a>
            </Button>
          ) : null}
        </div>

        {phone ? (
          <p className="mt-3 text-xs leading-relaxed text-content-subtle">
            WhatsApp : le message est pré-rempli avec la référence de la demande.
          </p>
        ) : null}
      </section>

      {/* --- Status --- */}
      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-500">
          {adminLabels.enquiries.updateStatus}
        </h2>
        <div className="mt-4 flex items-center gap-3">
          <Select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label={adminLabels.enquiries.updateStatus}
            disabled={savingStatus}
          >
            {Object.entries(adminLabels.statuses).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {savingStatus ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin text-gold-400" />
          ) : null}
        </div>
      </section>

      {/* --- Notes --- */}
      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-500">
          {adminLabels.enquiries.notes}
        </h2>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={adminLabels.enquiries.notesPlaceholder}
          rows={6}
          className="mt-4"
          aria-label={adminLabels.enquiries.notes}
        />
        <Button
          variant="surface"
          className="mt-4"
          onClick={onSaveNotes}
          disabled={savingNotes}
        >
          {savingNotes ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Check aria-hidden="true" />
          )}
          {adminLabels.enquiries.saveNotes}
        </Button>
      </section>

      {message ? (
        <p
          role="status"
          className="rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm text-gold-200"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}