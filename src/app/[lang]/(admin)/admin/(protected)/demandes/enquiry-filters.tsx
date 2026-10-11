"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { adminLabels } from "@/lib/admin/labels";

/**
 * Enquiry filters.
 *
 * State lives in the URL rather than in React so a filtered view can be
 * bookmarked, shared and reached with the browser's back button. Note that the
 * query string carries only filter values — never customer data.
 */
export function EnquiryFilters({
  initial,
  statuses,
  services,
}: {
  initial: {
    search: string;
    status: string;
    serviceType: string;
    from: string;
    to: string;
  };
  statuses: { value: string; label: string }[];
  services: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState(initial.search);

  function apply(next: Partial<typeof initial>) {
    const params = new URLSearchParams();
    const merged = { ...initial, ...next };

    if (merged.search.trim()) params.set("q", merged.search.trim());
    if (merged.status !== "all") params.set("status", merged.status);
    if (merged.serviceType !== "all") params.set("service", merged.serviceType);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);

    const query = params.toString();
    router.push(`/admin/demandes${query ? `?${query}` : ""}`);
  }

  const hasFilters =
    initial.search ||
    initial.status !== "all" ||
    initial.serviceType !== "all" ||
    initial.from ||
    initial.to;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        apply({ search });
      }}
      className="surface-card rounded-2xl p-5"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-content-subtle"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={adminLabels.enquiries.searchPlaceholder}
            aria-label={adminLabels.enquiries.search}
            className="pl-11"
          />
        </div>

        <Select
          value={initial.status}
          aria-label={adminLabels.enquiries.allStatuses}
          onChange={(event) => apply({ status: event.target.value })}
        >
          <option value="all">{adminLabels.enquiries.allStatuses}</option>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>

        <Select
          value={initial.serviceType}
          aria-label={adminLabels.enquiries.allServices}
          onChange={(event) => apply({ serviceType: event.target.value })}
        >
          <option value="all">{adminLabels.enquiries.allServices}</option>
          {services.map((service) => (
            <option key={service.value} value={service.value}>
              {service.label}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          value={initial.from}
          aria-label={adminLabels.enquiries.dateFrom}
          onChange={(event) => apply({ from: event.target.value })}
        />

        <Input
          type="date"
          value={initial.to}
          aria-label={adminLabels.enquiries.dateTo}
          onChange={(event) => apply({ to: event.target.value })}
        />

        <Button type="submit" variant="surface">
          {adminLabels.enquiries.search}
        </Button>
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.push("/admin/demandes")}
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-content-muted transition-colors hover:text-gold-200"
        >
          <X aria-hidden="true" className="size-3.5" />
          {adminLabels.common.clear}
        </button>
      ) : null}
    </form>
  );
}