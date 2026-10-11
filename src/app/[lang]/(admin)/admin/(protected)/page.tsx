import Link from "next/link";
import { Inbox, FileText, Mail, AlertTriangle } from "lucide-react";

import { getDashboardStats } from "@/lib/admin/queries";
import { adminLabels } from "@/lib/admin/labels";
import { Badge } from "@/components/ui/primitives";
import { getUnconfirmedFields } from "@/lib/settings/schema";
import { getSiteSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: adminLabels.nav.dashboard };

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  href?: string;
  icon: typeof Inbox;
  tone?: "neutral" | "gold" | "info";
}) {
  const tones = {
    neutral: "border-line",
    gold: "border-gold-700/60 bg-gold-400/[0.06]",
    info: "border-info/30",
  } as const;

  const inner = (
    <div
      className={`surface-card flex items-start gap-4 rounded-2xl border p-6 transition-colors ${tones[tone]} ${
        href ? "hover:border-gold-600" : ""
      }`}
    >
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-surface-2 text-gold-300">
        <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-display)] text-3xl leading-none text-gold-100">
          {value}
        </p>
        <p className="mt-2 text-sm leading-snug text-content-muted">{label}</p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default async function AdminDashboard() {
  const [stats, settings] = await Promise.all([
    getDashboardStats(),
    getSiteSettings(),
  ]);

  const unconfirmed = getUnconfirmedFields(settings);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl">{adminLabels.dashboard.title}</h1>
      </header>

      {unconfirmed.length > 0 ? (
        <section className="surface-card rounded-2xl border border-warning/40 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-warning"
            />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[#e8bf80]">
                {adminLabels.dashboard.setupTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-content-muted">
                {adminLabels.dashboard.setupBody}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {unconfirmed.map((item) => (
                  <li key={item.field}>
                    <Badge tone="warning">{item.field}</Badge>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/parametres"
                className="mt-5 inline-flex text-sm font-semibold text-gold-300 underline underline-offset-4 hover:text-gold-200"
              >
                {adminLabels.nav.settings} →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={adminLabels.dashboard.totalEnquiries}
          value={stats.totalEnquiries}
          href="/admin/demandes"
          icon={Inbox}
        />
        <StatCard
          label={adminLabels.dashboard.newEnquiries}
          value={stats.newEnquiries}
          href="/admin/demandes?status=nouveau"
          icon={Inbox}
          tone="gold"
        />
        <StatCard
          label={adminLabels.dashboard.confirmed}
          value={stats.confirmed}
          href="/admin/demandes?status=trajet_confirme"
          icon={Inbox}
        />
        <StatCard
          label={adminLabels.dashboard.contactMessages}
          value={stats.totalMessages}
          href="/admin/messages"
          icon={Mail}
          tone="info"
        />
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={adminLabels.dashboard.inProgress}
          value={stats.inProgress}
          href="/admin/demandes?status=client_contacte"
          icon={Inbox}
        />
        <StatCard
          label={adminLabels.dashboard.closed}
          value={stats.closed}
          href="/admin/demandes?status=cloture"
          icon={Inbox}
        />
        <StatCard
          label={adminLabels.dashboard.publishedPosts}
          value={stats.publishedPosts}
          href="/admin/blog"
          icon={FileText}
        />
        <StatCard
          label={adminLabels.dashboard.drafts}
          value={stats.draftPosts}
          href="/admin/blog?status=brouillon"
          icon={FileText}
        />
      </section>

      <section className="surface-card rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-base">{adminLabels.dashboard.recentEnquiries}</h2>
          <Link
            href="/admin/demandes"
            className="text-sm font-semibold text-gold-300 hover:text-gold-200"
          >
            {adminLabels.dashboard.viewAll} →
          </Link>
        </div>

        {stats.recent.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-content-muted">
            {adminLabels.dashboard.noEnquiries}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {stats.recent.map((enquiry) => (
              <li key={enquiry.id}>
                <Link
                  href={`/admin/demandes/${enquiry.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition-colors hover:bg-surface-2"
                >
                  <span className="font-mono text-xs text-gold-400">
                    {enquiry.reference}
                  </span>
                  <span className="text-sm text-content">{enquiry.fullName}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-content-muted">
                    {enquiry.pickupAddress} → {enquiry.destinationAddress}
                  </span>
                  <Badge
                    tone={
                      enquiry.status === "nouveau"
                        ? "gold"
                        : enquiry.status === "cloture"
                          ? "neutral"
                          : "info"
                    }
                  >
                    {adminLabels.statuses[enquiry.status]}
                  </Badge>
                  <time className="text-xs text-content-subtle">
                    {formatDateTime(enquiry.createdAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}