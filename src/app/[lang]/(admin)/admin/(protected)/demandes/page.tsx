import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import {
  getEnquiries,
  VALID_STATUSES,
  type EnquiryFilters as EnquiryQuery,
} from "@/lib/admin/queries";
import { adminLabels } from "@/lib/admin/labels";
import { formatDate, formatDateTime } from "@/lib/utils";

import { EnquiryFilters } from "./enquiry-filters";

export const metadata: Metadata = { title: adminLabels.enquiries.title };

const STATUS_TONES: Record<string, "gold" | "info" | "success" | "neutral"> = {
  nouveau: "gold",
  client_contacte: "info",
  devis_envoye: "info",
  trajet_confirme: "success",
  cloture: "neutral",
};

function notificationBadge(status: string | null) {
  if (status === "envoye") return <Badge tone="success">✓</Badge>;
  if (status === "echec") return <Badge tone="danger">!</Badge>;
  if (status === "non_configure") return <Badge tone="warning">–</Badge>;
  return <span className="text-content-subtle">{adminLabels.common.none}</span>;
}

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const one = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };

  // Fully resolved: every field has a value, so no downstream optional-checks.
  const filters: Required<Omit<EnquiryQuery, never>> = {
    search: one("q"),
    status: one("status") || "all",
    serviceType: one("service") || "all",
    from: one("from"),
    to: one("to"),
    page: Number.parseInt(one("page") || "1", 10) || 1,
  };

  const { rows, total, page, totalPages } = await getEnquiries(filters);

  const statuses = VALID_STATUSES.map((value) => ({
    value,
    label: adminLabels.statuses[value],
  }));
  const services = [
    { value: "gare", label: adminLabels.services.gare },
    { value: "aeroport", label: adminLabels.services.aeroport },
    { value: "longue_distance", label: adminLabels.services.longue_distance },
  ];

  const buildHref = (target: number) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.serviceType !== "all") params.set("service", filters.serviceType);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return `/admin/demandes${qs ? `?${qs}` : ""}`;
  };

  const exportParams = new URLSearchParams();
  if (filters.search) exportParams.set("q", filters.search);
  if (filters.status !== "all") exportParams.set("status", filters.status);
  if (filters.serviceType !== "all")
    exportParams.set("service", filters.serviceType);
  if (filters.from) exportParams.set("from", filters.from);
  if (filters.to) exportParams.set("to", filters.to);

  const exportHref = `/admin/demandes/export?${exportParams.toString()}`;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">{adminLabels.enquiries.title}</h1>
          <p className="mt-2 text-sm text-content-muted">
            {total} demande{total > 1 ? "s" : ""}
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex h-10 items-center rounded-lg border border-line-strong px-4 text-sm text-content transition-colors hover:border-gold-600 hover:text-gold-200"
        >
          {adminLabels.enquiries.export}
        </a>
      </header>

      <EnquiryFilters
        initial={{
          search: filters.search ?? "",
          status: filters.status ?? "all",
          serviceType: filters.serviceType ?? "all",
          from: filters.from ?? "",
          to: filters.to ?? "",
        }}
        statuses={statuses}
        services={services}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<Inbox aria-hidden="true" className="size-8" />}
          title={adminLabels.enquiries.empty}
          description={adminLabels.enquiries.emptyHint}
        />
      ) : (
        <div className="surface-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-strong text-xs uppercase tracking-wider text-content-subtle">
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.enquiries.reference}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.enquiries.customer}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.enquiries.journey}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.enquiries.departure}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.notifications.title}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.enquiries.status}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    {adminLabels.enquiries.received}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-surface-2/60">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/demandes/${row.id}`}
                        className="font-mono text-xs text-gold-300 underline-offset-4 hover:underline"
                      >
                        {row.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/demandes/${row.id}`} className="block">
                        <span className="block text-content">{row.fullName}</span>
                        <span className="block text-xs text-content-subtle">
                          {row.phone}
                        </span>
                      </Link>
                    </td>
                    <td className="max-w-xs px-5 py-4">
                      <span className="block truncate text-content-muted">
                        {row.pickupAddress}
                      </span>
                      <span className="block truncate text-xs text-content-subtle">
                        → {row.destinationAddress}
                      </span>
                      <span className="mt-1 block text-xs text-gold-600">
                        {adminLabels.services[row.serviceType]} ·{" "}
                        {row.passengers} pax
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-content-muted">
                      {formatDateTime(row.departureAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5">
                        <span title="E-mail" className="text-xs text-content-subtle">
                          E
                        </span>
                        {notificationBadge(row.emailStatus)}
                        <span title="WhatsApp" className="ml-1 text-xs text-content-subtle">
                          W
                        </span>
                        {notificationBadge(row.whatsappStatus)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={STATUS_TONES[row.status] ?? "neutral"}>
                        {adminLabels.statuses[row.status]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-content-subtle">
                      {formatDate(row.createdAt, "fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label="Pagination"
              className="flex items-center justify-between border-t border-line px-5 py-4 text-sm"
            >
              <Link
                href={buildHref(page - 1)}
                aria-disabled={page <= 1}
                className={
                  page <= 1
                    ? "pointer-events-none text-content-subtle opacity-40"
                    : "text-gold-300 hover:text-gold-200"
                }
              >
                ← Précédent
              </Link>
              <span className="text-content-subtle">
                {page} / {totalPages}
              </span>
              <Link
                href={buildHref(page + 1)}
                aria-disabled={page >= totalPages}
                className={
                  page >= totalPages
                    ? "pointer-events-none text-content-subtle opacity-40"
                    : "text-gold-300 hover:text-gold-200"
                }
              >
                Suivant →
              </Link>
            </nav>
          ) : null}
        </div>
      )}
    </div>
  );
}