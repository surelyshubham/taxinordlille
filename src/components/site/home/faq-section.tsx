import { FaqAccordion } from "@/components/site/faq-accordion";
import { Section, SectionHeading } from "@/components/ui/primitives";
import { FAQS } from "@/lib/content/faqs";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localeTags, type Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/settings";
import { faqSchema, serializeJsonLd } from "@/lib/seo/jsonld";

/**
 * FAQ section. The very same entries feed the `FAQPage` structured data, so
 * the machine-readable answers can never drift from the visible ones.
 */
export function FaqSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const entries = FAQS[locale];
  const schema = faqSchema(entries);

  return (
    <Section className="border-t border-line/70">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
          <SectionHeading
            eyebrow={dict.home.faq.eyebrow}
            title={dict.home.faq.title}
            className="lg:sticky lg:top-28 lg:self-start"
          />

          <div>
            {schema ? (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: serializeJsonLd({
                    ...schema,
                    url: `${getSiteUrl()}${locale === "fr" ? "" : "/en"}`,
                    inLanguage: localeTags[locale],
                  }),
                }}
              />
            ) : null}

            <FaqAccordion items={entries} />
          </div>
        </div>
      </div>
    </Section>
  );
}