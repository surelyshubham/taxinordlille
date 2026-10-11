import { getEnquiriesForExport } from "@/lib/admin/queries";
import { requireAdminAction } from "@/lib/auth/session";
import { adminLabels } from "@/lib/admin/labels";
import { toCsv } from "@/lib/utils";

/**
 * CSV export of the filtered enquiry list.
 *
 * Authorised in the handler itself — a route that returns customer data must
 * never rely on the surrounding layout having checked the session first.
 */
export async function GET(request: Request) {
  await requireAdminAction();

  const url = new URL(request.url);
  const filters = {
    search: url.searchParams.get("q") ?? "",
    status: url.searchParams.get("status") ?? "all",
    serviceType: url.searchParams.get("service") ?? "all",
    from: url.searchParams.get("from") ?? "",
    to: url.searchParams.get("to") ?? "",
  };

  const rows = await getEnquiriesForExport(filters);

  const headers = [
    adminLabels.enquiries.reference,
    adminLabels.enquiries.status,
    "Service",
    "Nom",
    "Téléphone",
    "E-mail",
    "Société",
    "Départ",
    "Destination",
    "Date et heure de départ",
    "Retour",
    "Passagers",
    "Vol / train",
    "Bagages",
    "Message",
    adminLabels.enquiries.received,
    "Consentement",
    "Notes internes",
  ];

  const csv = toCsv(
    headers,
    rows.map((row) => [
      row.reference,
      adminLabels.statuses[row.status],
      adminLabels.services[row.serviceType],
      row.fullName,
      row.phone,
      row.email ?? "",
      row.company ?? "",
      row.pickupAddress,
      row.destinationAddress,
      row.departureAt.toISOString(),
      row.returnAt?.toISOString() ?? "",
      row.passengers,
      row.flightOrTrainNumber ?? "",
      row.luggageNotes ?? "",
      row.message ?? "",
      row.createdAt.toISOString(),
      row.consentGivenAt.toISOString(),
      row.adminNotes ?? "",
    ]),
  );

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="demandes-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}