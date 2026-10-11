import Link from "next/link";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { AlertTriangle } from "lucide-react";

import type { LegalSection } from "@/lib/content/legal";
import { LEGAL_CONTENT } from "@/lib/content/legal";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import type { SiteSettings } from "@/lib/settings/schema";

/**
 * Shared renderer for the three legal pages.
 *
 * Every page carries a visible "model to be completed" banner: the copy is a
 * starting point produced by a developer, not legal advice, and the owner must
 * confirm every bracketed field before launch.
 */
export function LegalPage({
  locale,
  dict,
  settings,
  kind,
}: {
  locale: Locale;
  dict: Dictionary;
  settings: SiteSettings;
  kind: "mentions" | "privacy" | "cookies";
}) {
  const content = LEGAL_CONTENT[locale][kind];
  const otherLocale: Locale = locale === "fr" ? "en" : "fr";
  const otherContent = LEGAL_CONTENT[otherLocale][kind];

  const paths: Record<typeof kind, string> = {
    mentions: "/mentions-legales",
    privacy: "/politique-de-confidentialite",
    cookies: "/gestion-des-cookies",
  };

  const crumbs = [
    { name: dict.nav.home, href: localizedHref(locale, "/") },
    { name: content.title, href: localizedHref(locale, paths[kind]) },
  ];

  const lastUpdated = new Date().toISOString().slice(0, 10);

  return (
    <>
      <header className="border-b border-line/70 pb-12 pt-32 sm:pt-40">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Breadcrumbs items={crumbs} homeLabel={dict.nav.breadcrumbHome} />
          <h1 className="mt-8 text-4xl sm:text-5xl">{content.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-content-muted">
            {content.intro}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-16">
        {/* Template banner — deliberately impossible to miss. */}
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/[0.08] px-5 py-4">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-warning"
          />
          <div>
            <p className="text-sm font-semibold text-[#e8bf80]">{dict.legal.draft}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-content-muted">
              {dict.legal.draftNotice}
            </p>
          </div>
        </div>

        {/* Identity fields pulled live from the admin settings. */}
        {kind === "mentions" ? <IdentitySummary settings={settings} /> : null}

        <div className="mt-12 space-y-11">
          {content.sections.map((section) => (
            <LegalSectionBlock key={section.heading} section={section} />
          ))}
        </div>

        <p className="mt-14 border-t border-line pt-6 text-xs text-content-subtle">
          {dict.legal.lastUpdate} : {lastUpdated}
        </p>

        {/* Cross-language link so the other version is never a dead end. */}
        <p className="mt-4 text-xs text-content-subtle">
          <Link
            href={localizedHref(otherLocale, paths[kind])}
            className="text-gold-400 underline underline-offset-4 hover:text-gold-300"
          >
            {otherContent.title}
          </Link>
        </p>
      </div>
    </>
  );
}

function IdentitySummary({ settings }: { settings: SiteSettings }) {
  const rows = [
    ["Raison sociale", settings.legal.legalName],
    ["SIRET", settings.legal.siret],
    ["RCS", settings.legal.rcs],
    ["TVA", settings.legal.vatNumber],
    ["Assureur", settings.legal.insuranceInsurer],
    ["Hébergeur", settings.legal.hostingProvider],
    ["Téléphone", settings.phoneDisplay || settings.phone],
    ["E-mail", settings.email],
  ].filter(([, value]) => value);

  if (rows.length === 0) return null;

  return (
    <div className="mt-10 rounded-2xl border border-line bg-surface/60 p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-500">
        Informations renseignées
      </h2>
      <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-line/60 pb-2">
            <dt className="text-sm text-content-muted">{label}</dt>
            <dd className="text-right text-sm text-content">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LegalSectionBlock({ section }: { section: LegalSection }) {
  return (
    <section>
      <h2 className="text-xl leading-snug">{section.heading}</h2>
      {section.paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="mt-4 text-[0.975rem] leading-relaxed text-content-muted"
        >
          {paragraph}
        </p>
      ))}
      {section.list ? (
        <ul className="mt-5 space-y-3">
          {section.list.map((item, index) => (
            <li
              key={index}
              className="flex gap-3 text-[0.95rem] leading-relaxed text-content-muted"
            >
              <span
                aria-hidden="true"
                className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-gold-600"
              />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}