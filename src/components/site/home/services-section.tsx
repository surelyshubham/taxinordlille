import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Photo, PhotoScrim } from "@/components/site/photo";
import { Section, SectionHeading } from "@/components/ui/primitives";
import { SERVICES } from "@/lib/content/services";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import type { PhotoName } from "@/lib/photos";

/**
 * Service cards.
 *
 * Each card opens on its own photograph — the station, the airport, the road —
 * so a visitor choosing a service sees the place or the journey they are buying.
 * The three pictures are deliberately different; the small engraved icon stays
 * as an accent only, never as the primary image.
 */
export function ServicesSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const items: {
    key: "gare" | "aeroport" | "longue_distance";
    href: string;
    title: string;
    tagline: string;
    body: string;
    cta: string;
    photo: PhotoName;
  }[] = [
    {
      key: "gare",
      href: localizedHref(locale, `/services/${dict.services.gare.slug}`),
      title: dict.services.gare.name,
      tagline: dict.services.gare.tagline,
      body: dict.services.gare.short,
      cta: dict.common.viewService,
      photo: "gare-flandres-facade",
    },
    {
      key: "aeroport",
      href: localizedHref(locale, `/services/${dict.services.aeroport.slug}`),
      title: dict.services.aeroport.name,
      tagline: dict.services.aeroport.tagline,
      body: dict.services.aeroport.short,
      cta: dict.common.viewService,
      photo: "lesquin-acces",
    },
    {
      key: "longue_distance",
      href: localizedHref(locale, `/services/${dict.services.longe.slug}`),
      title: dict.services.longe.name,
      tagline: dict.services.longe.tagline,
      body: dict.services.longe.short,
      cta: dict.common.viewService,
      photo: "route-a1-lesquin",
    },
  ];

  return (
    <Section className="border-t border-line/70">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={dict.home.services.eyebrow}
          title={dict.home.services.title}
          description={dict.home.services.intro}
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = SERVICES.find((s) => s.key === item.key)?.icon;
            return (
              <article
                key={item.key}
                className="group surface-card edge-top relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:border-gold-700/60"
              >
                <div className="relative h-44 overflow-hidden border-b border-line">
                  <Photo
                    name={item.photo}
                    locale={locale}
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    width={1024}
                    height={576}
                    className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <PhotoScrim from="bottom" />

                  {/* A small engraved icon keeps the family resemblance to the
                      medallion without standing in for the photograph. */}
                  {Icon ? (
                    <span className="absolute left-5 top-5 inline-flex size-10 items-center justify-center rounded-xl border border-gold-700/40 bg-canvas/70 text-gold-400 backdrop-blur-sm">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <h3 className="text-xl">{item.title}</h3>
                  <p className="mt-1.5 text-sm font-medium text-gold-500">
                    {item.tagline}
                  </p>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-content-muted">
                    {item.body}
                  </p>

                  <Link
                    href={item.href}
                    className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-gold-300 transition-colors hover:text-gold-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
                  >
                    {item.cta}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Section>
  );
}