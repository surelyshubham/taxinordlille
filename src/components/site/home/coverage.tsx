import Image from "next/image";
import { MapPin } from "lucide-react";

import { Eyebrow } from "@/components/ui/primitives";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { SiteSettings } from "@/lib/settings/schema";

/**
 * Coverage area.
 *
 * The commune list is editable from the admin panel and deliberately starts
 * with only the hubs the business has actually named, so the page cannot
 * overstate coverage before the owner confirms it.
 */
export function CoverageArea({
  dict,
  settings,
}: {
  dict: Dictionary;
  settings: SiteSettings;
}) {
  const hubs = ["Lille", "Lille-Flandres", "Lille-Europe", "Lille-Lesquin"];

  return (
    <section className="border-t border-line/70 bg-surface/30 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>{dict.home.area.eyebrow}</Eyebrow>
            <h2 className="mt-5 text-3xl leading-[1.15] sm:text-4xl">
              {dict.home.area.title}
            </h2>
            <p className="mt-6 text-[1.0625rem] leading-relaxed text-content-muted">
              {settings.coverageArea || dict.home.area.body}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-content-subtle">
              {dict.home.area.note}
            </p>

            <ul className="mt-9 flex flex-wrap gap-2.5">
              {hubs.map((hub) => (
                <li
                  key={hub}
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-canvas px-4 py-2 text-sm text-content-muted"
                >
                  <MapPin aria-hidden="true" className="size-3.5 text-gold-600" />
                  {hub}
                </li>
              ))}
            </ul>
          </div>

          {/* Engraved seal, oversized. */}
          <div className="relative mx-auto aspect-square w-full max-w-sm lg:max-w-md">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(212,182,104,0.16),transparent_65%)]"
            />
            <Image
              src="/brand/logo-seal.png"
              alt=""
              aria-hidden="true"
              width={512}
              height={512}
              className="relative size-full opacity-70"
            />
          </div>
        </div>
      </div>
    </section>
  );
}