import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Section, SectionHeading } from "@/components/ui/primitives";
import { SERVICES } from "@/lib/content/services";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedHref, type Locale } from "@/lib/i18n/config";

/**
 * Service cards.
 *
 * Rather than repeating the medallion three times, each card is identified by a
 * large engraved line mark drawn in the same gold as the emblem, on a brass-lit
 * ground. The medallion itself stays reserved for the hero, the coverage
 * section and the footer, where it reads as the brand signature.
 */
export function ServicesSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const items = [
    {
      key: "gare" as const,
      href: localizedHref(locale, `/services/${dict.services.gare.slug}`),
      title: dict.services.gare.name,
      tagline: dict.services.gare.tagline,
      body: dict.services.gare.short,
      cta: dict.common.viewService,
    },
    {
      key: "aeroport" as const,
      href: localizedHref(locale, `/services/${dict.services.aeroport.slug}`),
      title: dict.services.aeroport.name,
      tagline: dict.services.aeroport.tagline,
      body: dict.services.aeroport.short,
      cta: dict.common.viewService,
    },
    {
      key: "longue_distance" as const,
      href: localizedHref(locale, `/services/${dict.services.longe.slug}`),
      title: dict.services.longe.name,
      tagline: dict.services.longe.tagline,
      body: dict.services.longe.short,
      cta: dict.common.viewService,
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
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "radial-gradient(ellipse 80% 70% at 50% 0%, rgba(212,182,104,0.14), transparent 70%), linear-gradient(180deg, #17140e, #0b0a08)",
                    }}
                  />
                  {/* Fine engraved arcs, echoing the medallion's concentric rings. */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 400 176"
                    className="absolute inset-0 size-full"
                    fill="none"
                  >
                    {[36, 58, 80, 102, 124].map((r) => (
                      <circle
                        key={r}
                        cx="200"
                        cy="230"
                        r={r}
                        stroke="currentColor"
                        strokeWidth="0.75"
                        className="text-gold-400/25"
                      />
                    ))}
                  </svg>

                  {Icon ? (
                    <span className="absolute left-1/2 top-1/2 inline-flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-gold-700/40 bg-canvas/60 text-gold-300 backdrop-blur-sm transition-transform duration-500 group-hover:scale-105">
                      <Icon aria-hidden="true" className="size-9" strokeWidth={1.25} />
                    </span>
                  ) : null}

                  <span className="absolute left-5 top-5 inline-flex size-10 items-center justify-center rounded-xl border border-gold-700/40 bg-canvas/70 text-gold-400 backdrop-blur-sm lg:hidden">
                    {Icon ? <Icon aria-hidden="true" className="size-5" /> : null}
                  </span>
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