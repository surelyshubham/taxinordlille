import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Closing call to action.
 *
 * Repeats the two facts that matter commercially and legally: a request is
 * free, and it is not a confirmed booking.
 */
export function CtaBanner({
  locale,
  dict,
  className,
  serviceType,
  eyebrow,
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
  serviceType?: string;
  eyebrow?: string;
}) {
  return (
    <section className={cn("px-5 sm:px-8", className)}>
      <div className="surface-panel relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-14 sm:px-12 lg:px-16 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(212,182,104,0.22) 0px, rgba(212,182,104,0.22) 1px, transparent 1px, transparent 11px)",
          }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          {eyebrow ? (
            <span className="inline-flex items-center gap-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-gold-400">
              <span aria-hidden="true" className="h-px w-6 bg-gold-600" />
              {eyebrow}
              <span aria-hidden="true" className="h-px w-6 bg-gold-600" />
            </span>
          ) : null}

          <h2 className="mt-5 text-3xl leading-[1.15] sm:text-4xl lg:text-[2.75rem]">
            {dict.home.cta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-content-muted">
            {dict.home.cta.body}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link
                href={localizedHref(locale, "/demande-de-devis")}
                {...(serviceType
                  ? { searchParams: { service: serviceType } }
                  : {})}
              >
                {dict.common.requestQuoteFree}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href={localizedHref(locale, "/contact")}>{dict.nav.contact}</Link>
            </Button>
          </div>

          <p className="mx-auto mt-7 max-w-xl text-xs leading-relaxed text-content-subtle">
            {dict.quote.notBooking}
          </p>
        </div>
      </div>
    </section>
  );
}