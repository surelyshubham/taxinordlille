import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { getSiteSettings } from "@/lib/settings";
import {
  telHref,
  whatsappHref,
} from "@/lib/settings/schema";
import { buildMetadata } from "@/lib/seo/metadata";
import type { ServiceType } from "@/lib/db/schema";

import { QuoteForm } from "./quote-form";

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
    path: "/demande-de-devis",
    title: dict.quote.title,
    description: dict.quote.intro,
  });
}

const VALID_SERVICE_TYPES: ServiceType[] = ["gare", "aeroport", "longue_distance"];

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [dict, settings] = await Promise.all([getDictionaryFor(lang), getSiteSettings()]);

  const rawService = query.service;
  const serviceParam = Array.isArray(rawService) ? rawService[0] : rawService;
  const defaultServiceType = VALID_SERVICE_TYPES.includes(
    serviceParam as ServiceType,
  )
    ? (serviceParam as ServiceType)
    : undefined;

  const isFr = locale === "fr";

  return (
    <>
      <PageHero
        eyebrow={dict.nav.quote}
        title={dict.quote.title}
        intro={dict.quote.intro}
        homeLabel={dict.nav.breadcrumbHome}
        breadcrumbs={[
          { name: dict.nav.home, href: localizedHref(locale, "/") },
          { name: dict.quote.title, href: localizedHref(locale, "/demande-de-devis") },
        ]}
      >
        <p className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-gold-700/50 bg-gold-400/[0.07] px-4 py-2 text-sm text-gold-200">
          <ShieldCheck aria-hidden="true" className="size-4" />
          {dict.quote.free}
        </p>
      </PageHero>

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="min-w-0">
            <QuoteForm
              defaultServiceType={defaultServiceType}
              labels={{
                locale,
                sections: dict.quote.sections,
                fields: dict.quote.fields as unknown as Record<string, string>,
                serviceTypes: dict.quote.serviceTypes,
                errors: dict.quote.errors as unknown as Record<string, string>,
                placeholders: {
                  pickupAddress: isFr
                    ? "Gare Lille-Flandres, 12 rue de la Gare…"
                    : "Lille-Flandres station, 12 rue de la Gare…",
                  destinationAddress: isFr
                    ? "Hôtel, aéroport, gare, adresse…"
                    : "Hotel, airport, station, address…",
                  flightOrTrainNumber: isFr ? "Ex. : TGV 8364, vol AF1471" : "e.g. TGV 8364, flight AF1471",
                  luggage: dict.quote.fields.luggagePlaceholder,
                  message: isFr
                    ? "Toute information utile à nous transmettre…"
                    : "Anything else we should know…",
                },
                consentPrefix: isFr
                  ? "J'accepte que Taxi Nord Lille utilise ces informations pour me recontacter au sujet de cette demande. Consultez notre "
                  : "I agree that Taxi Nord Lille may use this information to contact me about this request. See our ",
                consentLink: isFr
                  ? "politique de confidentialité"
                  : "privacy policy",
                submit: dict.quote.submit,
                submitting: dict.quote.submitting,
                notBooking: dict.quote.notBooking,
                successTitle: dict.quote.successTitle,
                successTemplate: dict.quote.successBody,
                successNotConfirmed: dict.quote.successNotConfirmed,
                errorTitle: dict.quote.errorTitle,
                newRequest: dict.quote.successNew,
                contactCta: isFr ? "Nous contacter" : "Contact us",
                contactHref: localizedHref(locale, "/contact"),
                privacyHref: localizedHref(
                  locale,
                  "/politique-de-confidentialite",
                ),
                optionalLabel: isFr ? "facultatif" : "optional",
              }}
            />
          </div>

          {/* --- Reassurance rail --- */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="surface-panel rounded-2xl p-7">
              <Image
                src="/brand/logo-mark.png"
                alt=""
                aria-hidden="true"
                width={256}
                height={256}
                className="mx-auto size-24"
              />
              <p className="mt-6 text-center text-sm leading-relaxed text-content-muted">
                {dict.home.hero.note}
              </p>

              <div className="rule-gold my-6" />

              <ul className="space-y-3 text-sm">
                <li>
                  <Button asChild variant="surface" block>
                    <a href={telHref(settings.phone)}>
                      <Phone aria-hidden="true" />
                      {settings.phoneDisplay || settings.phone}
                    </a>
                  </Button>
                </li>
                {settings.whatsappNumber ? (
                  <li>
                    <Button
                      asChild
                      variant="whatsapp"
                      block
                    >
                      <a
                        href={whatsappHref(
                          settings.whatsappNumber,
                          dict.whatsapp.defaultMessage,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle aria-hidden="true" />
                        {dict.common.whatsappUs}
                      </a>
                    </Button>
                  </li>
                ) : null}
                {settings.email ? (
                  <li>
                    <Button asChild variant="surface" block>
                      <a href={`mailto:${settings.email}`}>
                        <Mail aria-hidden="true" />
                        {settings.email}
                      </a>
                    </Button>
                  </li>
                ) : null}
              </ul>
            </div>

            <p className="text-xs leading-relaxed text-content-subtle">
              {isFr
                ? "Les champs marqués d'un astérisque sont obligatoires. Vos données ne servent qu'à traiter cette demande."
                : "Fields marked with an asterisk are required. Your details are used only to process this request."}
            </p>

            <Link
              href={localizedHref(locale, "/contact")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gold-300 transition-colors hover:text-gold-200"
            >
              {dict.nav.contact}
              <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}