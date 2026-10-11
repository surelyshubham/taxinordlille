import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BellOff, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/primitives";
import { getEnquiryById } from "@/lib/admin/queries";
import { adminLabels } from "@/lib/admin/labels";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import { formatDateTime } from "@/lib/utils";
import { ResendNotifications } from "./resend-notifications";
import { DeleteEnquiry } from "./delete-enquiry";

import { EnquiryControls } from "./enquiry-controls";

export const metadata: Metadata = { title: adminLabels.enquiries.detail };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line/60 py-3.5 sm:flex-row sm:gap-6">
      <dt className="w-52 shrink-0 text-xs uppercase tracking-wider text-content-subtle">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 break-words text-sm text-content">{value}</dd>
    </div>
  );
}

export default async function EnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { enquiry, notifications } = await getEnquiryById(id);

  if (!enquiry) notFound();

  const dict = await getDictionaryFor(
    enquiry.locale === "en" ? "en" : "fr",
  );

  return (
    <div className="space-y-8">
      <Link
        href="/admin/demandes"
        className="inline-flex items-center gap-2 text-sm text-content-muted transition-colors hover:text-gold-200"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {adminLabels.enquiries.back}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-gold-400">{enquiry.reference}</p>
          <h1 className="mt-2 text-3xl">{enquiry.fullName}</h1>
          <p className="mt-2 text-sm text-content-muted">
            {adminLabels.services[enquiry.serviceType]} ·{" "}
            {formatDateTime(enquiry.createdAt)}
          </p>
        </div>
        <Badge tone="gold" className="mt-2">
          {adminLabels.statuses[enquiry.status]}
        </Badge>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section className="surface-card rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-500">
              {adminLabels.enquiries.journeyDetails}
            </h2>
            <dl className="mt-4">
              <Row label="Départ" value={enquiry.pickupAddress} />
              <Row label="Destination" value={enquiry.destinationAddress} />
              <Row
                label="Date et heure"
                value={formatDateTime(enquiry.departureAt)}
              />
              {enquiry.returnAt ? (
                <Row label="Retour" value={formatDateTime(enquiry.returnAt)} />
              ) : null}
              <Row label="Passagers" value={enquiry.passengers} />
              {enquiry.company ? (
                <Row label="Société" value={enquiry.company} />
              ) : null}
              {enquiry.billingReference ? (
                <Row label="Facturation" value={enquiry.billingReference} />
              ) : null}
            </dl>
          </section>

          {enquiry.flightOrTrainNumber ||
          enquiry.luggageNotes ||
          enquiry.message ? (
            <section className="surface-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-500">
                {adminLabels.enquiries.extras}
              </h2>
              <dl className="mt-4">
                {enquiry.flightOrTrainNumber ? (
                  <Row label="Vol / train" value={enquiry.flightOrTrainNumber} />
                ) : null}
                {enquiry.luggageNotes ? (
                  <Row
                    label="Bagages"
                    value={
                      <span className="whitespace-pre-wrap">
                        {enquiry.luggageNotes}
                      </span>
                    }
                  />
                ) : null}
                {enquiry.message ? (
                  <Row
                    label="Message"
                    value={
                      <span className="whitespace-pre-wrap">
                        {enquiry.message}
                      </span>
                    }
                  />
                ) : null}
              </dl>
            </section>
          ) : null}

          {/* --- Notification log --- */}
          <section className="surface-card rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-500">
              {adminLabels.notifications.title}
            </h2>

            {notifications.length === 0 ? (
              <p className="mt-4 text-sm text-content-muted">
                {adminLabels.notifications.none}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notifications.map((log) => (
                  <li
                    key={log.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line-strong px-4 py-3 text-xs"
                  >
                    {log.status === "envoye" ? (
                      <CheckCircle2
                        aria-hidden="true"
                        className="size-4 shrink-0 text-success"
                      />
                    ) : log.status === "echec" ? (
                      <XCircle
                        aria-hidden="true"
                        className="size-4 shrink-0 text-danger"
                      />
                    ) : (
                      <BellOff
                        aria-hidden="true"
                        className="size-4 shrink-0 text-warning"
                      />
                    )}

                    <span className="font-medium uppercase tracking-wide text-gold-300">
                      {log.channel}
                    </span>
                    <span className="text-content-subtle">
                      → {log.target === "business" ? " exploitant" : " client"}
                    </span>
                    <span className="text-content-muted">
                      {adminLabels.notifications[
                        log.status as "envoye" | "echec" | "non_configure"
                      ] ?? log.status}
                    </span>
                    <span className="ml-auto text-content-subtle">
                      {formatDateTime(log.createdAt)}
                    </span>

                    {log.errorDetail ? (
                      <p className="w-full pt-1 text-content-subtle">
                        {adminLabels.notifications.reason} : {log.errorDetail}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <ResendNotifications enquiryId={enquiry.id} />

            <p className="mt-4 text-xs leading-relaxed text-content-subtle">
              L&apos;envoi d&apos;une notification ne change pas le statut de la
              demande : le statut est géré manuellement.
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <EnquiryControls
            enquiryId={enquiry.id}
            initialStatus={enquiry.status}
            initialNotes={enquiry.adminNotes ?? ""}
            phone={enquiry.phone}
            email={enquiry.email}
            customerName={enquiry.fullName}
            reference={enquiry.reference}
            siteWhatsappMessage={dict.whatsapp.withRef}
          />

          <p className="text-xs leading-relaxed text-content-subtle">
            {adminLabels.enquiries.consentGiven} :{" "}
            {formatDateTime(enquiry.consentGivenAt)}
          </p>

          <DeleteEnquiry enquiryId={enquiry.id} />
        </aside>
      </div>
    </div>
  );
}