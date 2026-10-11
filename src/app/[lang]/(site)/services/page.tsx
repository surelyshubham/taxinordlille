import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

import { CtaBanner } from "@/components/site/cta-banner";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/primitives";
import { SERVICES } from "@/lib/content/services";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { getSiteSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, serializeJsonLd } from "@/lib/seo/jsonld";
import { getSiteUrl } from "@/lib/settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [dict, settings] = await Promise.all([getDictionaryFor(lang), getSiteSettings()]);

  return buildMetadata({
    locale: lang,
    settings,
    path: "/services",
    title: dict.services.overview.title,
    description: dict.services.overview.intro,
  });
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const dict = await getDictionaryFor(lang);
  const settings = await getSiteSettings();

  const cards = [
    {
      key: "gare" as const,
      title: dict.services.gare.name,
      tagline: dict.services.gare.tagline,
      body: dict.services.gare.short,
      points: [
        dict.services.overview.gareBest,
        dict.services.overview.gareInfo,
      ],
      href: localizedHref(locale, `/services/${dict.services.gare.slug}`),
    },
    {
      key: "aeroport" as const,
      title: dict.services.aeroport.name,
      tagline: dict.services.aeroport.tagline,
      body: dict.services.aeroport.short,
      points: [
        dict.services.overview.aeroportBest,
        dict.services.overview.aeroportInfo,
      ],
      href: localizedHref(locale, `/services/${dict.services.aeroport.slug}`),
    },
    {
      key: "longue_distance" as const,
      title: dict.services.longe.name,
      tagline: dict.services.longe.tagline,
      body: dict.services.longe.short,
      points: [
        dict.services.overview.longueBest,
        dict.services.overview.longueInfo,
      ],
      href: localizedHref(locale, `/services/${dict.services.longe.slug}`),
    },
  ];

  const crumbs = [
    { name: dict.nav.home, href: localizedHref(locale, "/") },
    { name: dict.nav.services, href: localizedHref(locale, "/services") },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbSchema(crumbs, getSiteUrl())),
        }}
      />

      <PageHero
        eyebrow={dict.nav.services}
        title={dict.services.overview.title}
        intro={dict.services.overview.intro}
        homeLabel={dict.nav.breadcrumbHome}
        breadcrumbs={crumbs}
      />

      <Section>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = SERVICES.find((s) => s.key === card.key)?.icon;
              return (
                <article
                  key={card.key}
                  className="surface-card edge-top flex flex-col rounded-2xl p-8 transition-colors duration-300 hover:border-gold-700/60"
                >
                  {Icon ? (
                    <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-gold-700/50 bg-surface-2 text-gold-300">
                      <Icon aria-hidden="true" className="size-6" strokeWidth={1.25} />
                    </span>
                  ) : null}

                  <h2 className="mt-6 text-2xl">{card.title}</h2>
                  <p className="mt-2 text-sm font-medium text-gold-500">
                    {card.tagline}
                  </p>
                  <p className="mt-5 flex-1 text-[0.975rem] leading-relaxed text-content-muted">
                    {card.body}
                  </p>

                  <ul className="mt-6 space-y-2.5 border-t border-line pt-6">
                    {card.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2.5 text-sm text-content-muted"
                      >
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-gold-600"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 flex flex-col gap-3">
                    <Button asChild variant="outline" block>
                      <Link href={card.href}>
                        {dict.common.learnMore}
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button asChild block>
                      <Link
                        href={`${localizedHref(locale, "/demande-de-devis")}?service=${card.key}`}
                      >
                        {dict.common.requestQuote}
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Section>

      <Section className="border-t border-line/70 bg-surface/30">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="text-2xl sm:text-3xl">{dict.services.overview.compareTitle}</h2>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-strong">
                  <th scope="col" className="py-4 pr-6 font-semibold text-gold-300">
                    {dict.services.overview.tableService}
                  </th>
                  <th scope="col" className="py-4 pr-6 font-semibold text-gold-300">
                    {dict.services.overview.tableBestFor}
                  </th>
                  <th scope="col" className="py-4 font-semibold text-gold-300">
                    {dict.services.overview.tableInfo}
                  </th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.key} className="border-b border-line/60">
                    <th scope="row" className="py-4 pr-6 font-medium text-content">
                      <Link
                        href={card.href}
                        className="transition-colors hover:text-gold-200"
                      >
                        {card.title}
                      </Link>
                    </th>
                    <td className="py-4 pr-6 text-content-muted">{card.points[0]}</td>
                    <td className="py-4 text-content-muted">{card.points[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-10 text-sm text-content-subtle">{settings.coverageArea}</p>
        </div>
      </Section>

      <CtaBanner
        locale={locale}
        dict={dict}
        className="pb-8 sm:pb-12"
        eyebrow={dict.services.overview.ctaTitle}
      />
    </>
  );
}