import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Info, MapPin, Plane, Route, TrainFront } from "lucide-react";

import { CtaBanner } from "@/components/site/cta-banner";
import { PageHero } from "@/components/site/page-hero";
import {
  ArtAeroport,
  ArtGare,
  ArtRoute,
} from "@/components/brand/artwork";
import { Photo, PhotoScrim } from "@/components/site/photo";
import type { PhotoName } from "@/lib/photos";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/primitives";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { getSiteSettings, getSiteUrl } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  serializeJsonLd,
  serviceSchema,
} from "@/lib/seo/jsonld";
import type { ServiceType } from "@/lib/db/schema";

/* -------------------------------------------------------------------------- */
/* Content model                                                               */
/* -------------------------------------------------------------------------- */

type Block = { title: string; body: string; icon?: typeof MapPin };
type Step = { title: string; body: string };
type Tip = { title: string; body: string };

/** Resolve the three dictionary variants into one renderable shape. */
function getServiceContent(
  dict: Dictionary,
  key: ServiceType,
): {
  slug: string;
  name: string;
  tagline: string;
  intro: string;
  /** Presentational section between the intro and the process steps. */
  mid: { title: string; intro: string; items: Block[] };
  stepsTitle: string;
  steps: Step[];
  tipsTitle: string;
  tips: Tip[];
  ctaTitle: string;
  ctaBody: string;
} {
  if (key === "gare") {
    return {
      slug: dict.services.gare.slug,
      name: dict.services.gare.name,
      tagline: dict.services.gare.tagline,
      intro: dict.services.gare.intro,
      mid: {
        title: dict.services.gare.stationsTitle,
        intro: dict.services.gare.stationsIntro,
        items: [
          {
            title: "Lille-Flandres",
            body: dict.services.gare.stationsIntro,
            icon: TrainFront,
          },
          {
            title: "Lille-Europe",
            body: dict.services.gare.stationsIntro,
            icon: TrainFront,
          },
        ],
      },
      stepsTitle: dict.services.gare.stepsTitle,
      steps: [
        { title: dict.services.gare.step1Title, body: dict.services.gare.step1Body },
        { title: dict.services.gare.step2Title, body: dict.services.gare.step2Body },
        { title: dict.services.gare.step3Title, body: dict.services.gare.step3Body },
      ],
      tipsTitle: dict.services.gare.practicalTitle,
      tips: [
        { title: dict.services.gare.tip1Title, body: dict.services.gare.tip1Body },
        { title: dict.services.gare.tip2Title, body: dict.services.gare.tip2Body },
        { title: dict.services.gare.tip3Title, body: dict.services.gare.tip3Body },
      ],
      ctaTitle: dict.services.gare.ctaTitle,
      ctaBody: dict.services.gare.ctaBody,
    };
  }

  if (key === "aeroport") {
    return {
      slug: dict.services.aeroport.slug,
      name: dict.services.aeroport.name,
      tagline: dict.services.aeroport.tagline,
      intro: dict.services.aeroport.intro,
      mid: {
        title: dict.services.aeroport.airportsTitle,
        intro: dict.services.aeroport.airportsIntro,
        items: [
          {
            title: dict.services.aeroport.lilleLesquin,
            body: dict.services.aeroport.lilleLesquinBody,
            icon: Plane,
          },
          {
            title: dict.services.aeroport.otherAirports,
            body: dict.services.aeroport.otherAirportsBody,
            icon: Plane,
          },
        ],
      },
      stepsTitle: dict.services.aeroport.stepsTitle,
      steps: [
        { title: dict.services.aeroport.step1Title, body: dict.services.aeroport.step1Body },
        { title: dict.services.aeroport.step2Title, body: dict.services.aeroport.step2Body },
        { title: dict.services.aeroport.step3Title, body: dict.services.aeroport.step3Body },
      ],
      tipsTitle: dict.services.aeroport.infoTitle,
      tips: [
        { title: dict.services.aeroport.tip1Title, body: dict.services.aeroport.tip1Body },
        { title: dict.services.aeroport.tip2Title, body: dict.services.aeroport.tip2Body },
        { title: dict.services.aeroport.tip3Title, body: dict.services.aeroport.tip3Body },
      ],
      ctaTitle: dict.services.aeroport.ctaTitle,
      ctaBody: dict.services.aeroport.ctaBody,
    };
  }

  return {
    slug: dict.services.longe.slug,
    name: dict.services.longe.name,
    tagline: dict.services.longe.tagline,
    intro: dict.services.longe.intro,
    mid: {
      title: dict.services.longe.destinationsTitle,
      intro: dict.services.longe.destinationsIntro,
      items: [
        { title: dict.services.longe.dest1, body: dict.services.longe.dest1Body, icon: MapPin },
        { title: dict.services.longe.dest2, body: dict.services.longe.dest2Body, icon: MapPin },
        { title: dict.services.longe.dest3, body: dict.services.longe.dest3Body, icon: MapPin },
        { title: dict.services.longe.dest4, body: dict.services.longe.dest4Body, icon: Route },
      ],
    },
    stepsTitle: dict.services.longe.processTitle,
    steps: [
      { title: dict.services.longe.step1Title, body: dict.services.longe.step1Body },
      { title: dict.services.longe.step2Title, body: dict.services.longe.step2Body },
      { title: dict.services.longe.step3Title, body: dict.services.longe.step3Body },
    ],
    tipsTitle: dict.services.longe.infoTitle,
    tips: [
      { title: dict.services.longe.tip1Title, body: dict.services.longe.tip1Body },
      { title: dict.services.longe.tip2Title, body: dict.services.longe.tip2Body },
      { title: dict.services.longe.tip3Title, body: dict.services.longe.tip3Body },
    ],
    ctaTitle: dict.services.longe.ctaTitle,
    ctaBody: dict.services.longe.ctaBody,
  };
}

const SERVICE_FOR_KEY: Record<ServiceType, ServiceType> = {
  gare: "gare",
  aeroport: "aeroport",
  longue_distance: "longue_distance",
};

const ICONS: Record<ServiceType, typeof TrainFront> = {
  gare: TrainFront,
  aeroport: Plane,
  longue_distance: Route,
};

/** One engraved scene per service, so each page is visually identifiable. */
const SCENES: Record<ServiceType, typeof ArtGare> = {
  gare: ArtGare,
  aeroport: ArtAeroport,
  longue_distance: ArtRoute,
};

/**
 * Where a real photograph of the place exists, it is used in place of the
 * engraving — a visitor choosing a station transfer is better served by
 * seeing the hall they will be collected from than a drawing of a train.
 *
 * Long-distance journeys have no such place, so that page keeps its artwork
 * rather than borrowing an unrelated picture of Lille.
 */
const SCENE_PHOTOS: Partial<Record<ServiceType, PhotoName>> = {
  gare: "gare-flandres-hall",
  aeroport: "lesquin-interieur",
};

/** Resolve a URL slug to one of the three known services. */
function resolveKey(dict: Dictionary, slug: string): ServiceType | null {
  for (const key of Object.keys(SERVICE_FOR_KEY) as ServiceType[]) {
    if (getServiceContent(dict, key).slug === slug) return key;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const [dict, settings] = await Promise.all([getDictionaryFor(lang), getSiteSettings()]);

  const key = resolveKey(dict, slug);
  if (!key) return { title: dict.common.notFoundTitle };

  const content = getServiceContent(dict, key);

  return buildMetadata({
    locale: lang,
    settings,
    path: `/services/${slug}`,
    title: `${content.name} — ${content.tagline}`,
    description: content.intro.slice(0, 175),
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [dict, settings] = await Promise.all([getDictionaryFor(lang), getSiteSettings()]);

  const key = resolveKey(dict, slug);
  if (!key) notFound();

  const content = getServiceContent(dict, key);
  const Icon = ICONS[key];
  const Scene = SCENES[key];
  const scenePhoto = SCENE_PHOTOS[key];

  const crumbs = [
    { name: dict.nav.home, href: localizedHref(locale, "/") },
    { name: dict.nav.services, href: localizedHref(locale, "/services") },
    { name: content.name, href: localizedHref(locale, `/services/${slug}`) },
  ];

  const jsonLd = [
    breadcrumbSchema(crumbs, getSiteUrl()),
    serviceSchema(settings, getSiteUrl(), locale, {
      name: content.name,
      description: content.intro,
      path: `/services/${slug}`,
    }),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <PageHero
        eyebrow={dict.nav.services}
        title={content.name}
        intro={content.intro}
        homeLabel={dict.nav.breadcrumbHome}
        breadcrumbs={crumbs}
        className="pb-0"
      >
        <p className="mt-6 flex items-center gap-3 text-sm font-medium text-gold-400">
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.25} />
          {content.tagline}
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={`${localizedHref(locale, "/demande-de-devis")}?service=${key}`}>
              {content.ctaTitle}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={localizedHref(locale, "/contact")}>{dict.nav.contact}</Link>
          </Button>
        </div>

        {/* The place itself, bleeding off the bottom edge of the masthead. */}
        <div className="pointer-events-none -mb-px mt-12 hidden lg:block">
          {scenePhoto ? (
            <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-line">
              <Photo
                name={scenePhoto}
                locale={locale}
                sizes="(min-width: 1024px) 1200px, 100vw"
                width={1600}
                height={900}
              />
              <PhotoScrim from="bottom" />
            </div>
          ) : (
            <Scene className="h-56 w-full object-cover opacity-80" />
          )}
        </div>
      </PageHero>

      {/* --- Mid section --- */}
      <Section>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="text-3xl sm:text-4xl">{content.mid.title}</h2>
          <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-content-muted">
            {content.mid.intro}
          </p>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {content.mid.items.map((item) => {
              const ItemIcon = item.icon ?? Icon;
              return (
                <li
                  key={item.title}
                  className="surface-card edge-top flex gap-5 rounded-2xl p-7"
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-gold-700/50 bg-surface-2 text-gold-300">
                    <ItemIcon aria-hidden="true" className="size-5" strokeWidth={1.25} />
                  </span>
                  <div>
                    <h3 className="text-lg leading-snug">{item.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-content-muted">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      {/* --- Process --- */}
      <Section className="border-t border-line/70 bg-surface/30">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="text-3xl sm:text-4xl">{content.stepsTitle}</h2>

          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {content.steps.map((step, index) => (
              <li key={step.title} className="relative">
                <span
                  aria-hidden="true"
                  className="font-[family-name:var(--font-display)] text-5xl leading-none text-gold-800"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg leading-snug">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-content-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* --- Practical info --- */}
      <Section>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="text-3xl sm:text-4xl">{content.tipsTitle}</h2>

          <ul className="mt-10 divide-y divide-line border-y border-line">
            {content.tips.map((tip) => (
              <li key={tip.title} className="flex gap-5 py-7">
                <Info
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-gold-600"
                />
                <div>
                  <h3 className="text-base leading-snug">{tip.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-content-muted">
                    {tip.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Inline link to the quote form — the conversion path for this page. */}
          <div className="surface-panel mt-14 rounded-2xl p-8 text-center sm:p-10">
            <p className="text-content-muted">{content.ctaBody}</p>
            <Button asChild size="lg" className="mt-6">
              <Link href={`${localizedHref(locale, "/demande-de-devis")}?service=${key}`}>
                {content.ctaTitle}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {/* Internal links to the sibling services. */}
          <div className="mt-14">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-500">
              {dict.services_nav.all}
            </h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {(Object.keys(SERVICE_FOR_KEY) as ServiceType[])
                .filter((other) => other !== key)
                .map((other) => {
                  const sibling = getServiceContent(dict, other);
                  return (
                    <li key={other}>
                      <Link
                        href={localizedHref(locale, `/services/${sibling.slug}`)}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-line-strong px-5 py-4 text-sm text-content transition-colors hover:border-gold-600 hover:text-gold-200"
                      >
                        <span className="flex items-center gap-3">
                          {(() => {
                            const SiblingIcon = ICONS[other];
                            return (
                              <SiblingIcon
                                aria-hidden="true"
                                className="size-4 text-gold-600"
                                strokeWidth={1.5}
                              />
                            );
                          })()}
                          {sibling.name}
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-gold-700 transition-transform duration-300 group-hover:translate-x-0.5"
                        />
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </Section>

      <CtaBanner
        locale={locale}
        dict={dict}
        className="pb-8 sm:pb-12"
        serviceType={key}
      />
    </>
  );
}