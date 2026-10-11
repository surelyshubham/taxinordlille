import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/primitives";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { getSiteSettings, getSiteUrl } from "@/lib/settings";
import { telHref, whatsappHref } from "@/lib/settings/schema";
import { breadcrumbSchema, serializeJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

import { ContactForm } from "./contact-form";

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
    path: "/contact",
    title: dict.contact.title,
    description: dict.contact.intro,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const isFr = locale === "fr";

  const [dict, settings] = await Promise.all([getDictionaryFor(lang), getSiteSettings()]);

  const crumbs = [
    { name: dict.nav.home, href: localizedHref(locale, "/") },
    { name: dict.nav.contact, href: localizedHref(locale, "/contact") },
  ];

  const addressLine = [
    settings.address.street,
    settings.address.postalCode,
    settings.address.city,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbSchema(crumbs, getSiteUrl())),
        }}
      />

      <PageHero
        eyebrow={dict.nav.contact}
        title={dict.contact.title}
        intro={dict.contact.intro}
        homeLabel={dict.nav.breadcrumbHome}
        breadcrumbs={crumbs}
      />

      <Section>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
            <div className="min-w-0">
              <h2 className="text-2xl">{dict.contact.formTitle}</h2>

              <div className="mt-8">
                <ContactForm
                  labels={{
                    locale,
                    fields: dict.contact.fields as unknown as Record<string, string>,
                    subjects: dict.contact.subjects,
                    errors: dict.contact.errors as unknown as Record<string, string>,
                    submit: dict.contact.submit,
                    submitting: dict.contact.submitting,
                    successTitle: dict.contact.successTitle,
                    successTemplate: dict.contact.successBody,
                    optionalLabel: isFr ? "facultatif" : "optional",
                  }}
                />
              </div>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              <div className="surface-panel rounded-2xl p-7">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
                  {dict.contact.detailsTitle}
                </h2>

                <ul className="mt-6 space-y-5 text-sm">
                  <li>
                    <a
                      href={telHref(settings.phone)}
                      className="group flex items-start gap-3 transition-colors hover:text-gold-200"
                    >
                      <Phone
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-gold-600"
                      />
                      <span>
                        <span className="block text-content">
                          {settings.phoneDisplay || settings.phone}
                        </span>
                        <span className="mt-0.5 block text-xs text-content-subtle">
                          {dict.nav.call}
                        </span>
                      </span>
                    </a>
                  </li>

                  {settings.whatsappNumber ? (
                    <li>
                      <a
                        href={whatsappHref(settings.whatsappNumber, dict.whatsapp.defaultMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-3 transition-colors hover:text-gold-200"
                      >
                        <MessageCircle
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-gold-600"
                        />
                        <span className="text-content">{dict.common.whatsappUs}</span>
                      </a>
                    </li>
                  ) : null}

                  {settings.email ? (
                    <li>
                      <a
                        href={`mailto:${settings.email}`}
                        className="flex items-start gap-3 break-all transition-colors hover:text-gold-200"
                      >
                        <Mail
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-gold-600"
                        />
                        <span className="text-content">{settings.email}</span>
                      </a>
                    </li>
                  ) : null}

                  {addressLine ? (
                    <li className="flex items-start gap-3">
                      <MapPin
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-gold-600"
                      />
                      <span className="text-content-muted">{addressLine}</span>
                    </li>
                  ) : null}
                </ul>

                {settings.openingHours ? (
                  <div className="mt-7 border-t border-line pt-6">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-500">
                      <Clock aria-hidden="true" className="size-3.5" />
                      {dict.contact.hoursTitle}
                    </h3>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-content-muted">
                      {settings.openingHours}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-content-subtle">
                      {dict.contact.hoursNote}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Route visitors to the higher-intent form. */}
              <div className="surface-card rounded-2xl p-7">
                <h2 className="text-lg">{dict.contact.quoteCta}</h2>
                <p className="mt-3 text-sm leading-relaxed text-content-muted">
                  {dict.contact.quoteCtaBody}
                </p>
                <Button asChild className="mt-6" block>
                  <Link href={localizedHref(locale, "/demande-de-devis")}>
                    {dict.common.requestQuote}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </Section>
    </>
  );
}