import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PhoneCall } from "lucide-react";

import { ArtHero } from "@/components/brand/artwork";
import { Photo, PhotoScrim } from "@/components/site/photo";
import { HeroQuoteCard } from "@/components/site/hero-quote-card";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/primitives";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import { telHref } from "@/lib/settings/schema";

export function HomeHero({
  locale,
  dict,
  phone,
  phoneDisplay,
}: {
  locale: Locale;
  dict: Dictionary;
  phone: string;
  phoneDisplay: string;
}) {
  const assurances = [
    dict.home.hero.stat1,
    dict.home.hero.stat2,
    dict.home.hero.stat3,
  ];

  return (
    <section className="relative overflow-hidden pt-[4.5rem]">
      {/* Lille at night behind the engraving — the belfry photograph, then the
          drawn skyline over it for the engraved linework, then the scrims that
          pull everything back into the canvas so the headline stays legible. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0">
          <Photo
            name="lille-beffroi"
            locale={locale}
            sizes="100vw"
            width={2000}
            height={1125}
            priority
          />
        </div>
        <PhotoScrim from="full" />
        <ArtHero className="absolute inset-x-0 top-0 h-full w-full opacity-25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(212,182,104,0.10),transparent_65%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/40 via-canvas/70 to-canvas" />
        <Image
          src="/brand/logo-mark.png"
          alt=""
          width={256}
          height={215}
          className="absolute -right-24 top-40 w-[34rem] max-w-none opacity-[0.05]"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:pb-32 lg:pt-28">
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,26rem)] lg:gap-16">
          <div>
            <Eyebrow>{dict.home.hero.eyebrow}</Eyebrow>

            <h1 className="mt-6 text-[2.75rem] leading-[1.06] sm:text-6xl lg:text-[4.25rem]">
              {dict.home.hero.title}
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-content-muted sm:text-xl">
              {dict.home.hero.subtitle}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={localizedHref(locale, "/demande-de-devis")}>
                  {dict.common.requestQuoteFree}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <a href={telHref(phone)}>
                  <PhoneCall aria-hidden="true" />
                  {dict.common.callNow}
                  <span className="sr-only"> — {phoneDisplay}</span>
                </a>
              </Button>
            </div>

            <p className="mt-6 max-w-xl text-sm leading-relaxed text-content-subtle">
              {dict.home.hero.note}
            </p>

            <ul className="mt-10 flex flex-col gap-2.5 border-t border-line pt-8 sm:flex-row sm:flex-wrap sm:gap-x-8">
              {assurances.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm text-content-muted"
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rotate-45 bg-gold-500"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <HeroQuoteCard
            quoteHref={localizedHref(locale, "/demande-de-devis")}
            title={dict.home.hero.cardTitle}
            note={dict.home.hero.cardNote}
            labels={{
              phone: dict.quote.fields.phone,
              pickupAddress: dict.quote.fields.pickupAddress,
              destinationAddress: dict.quote.fields.destinationAddress,
              submit: dict.common.requestQuote,
              submitting: dict.common.loading,
              errors: {
                phone: dict.quote.errors.phone,
                pickupAddress: dict.quote.errors.pickupAddress,
                destinationAddress: dict.quote.errors.destinationAddress,
              },
            }}
            className="lg:sticky lg:top-24"
          />
        </div>
      </div>
    </section>
  );
}