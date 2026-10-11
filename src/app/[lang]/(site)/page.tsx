import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogSection } from "@/components/site/home/blog-section";
import { CoverageArea } from "@/components/site/home/coverage";
import { CtaBanner } from "@/components/site/cta-banner";
import { FaqSection } from "@/components/site/home/faq-section";
import { HomeHero } from "@/components/site/home/hero";
import { HowItWorks } from "@/components/site/home/how-it-works";
import { ServicesSection } from "@/components/site/home/services-section";
import { WhyUs } from "@/components/site/home/why-us";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getSiteSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatPhoneDisplay } from "@/lib/settings/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [dict, settings] = await Promise.all([
    getDictionaryFor(lang),
    getSiteSettings(),
  ]);

  return buildMetadata({
    locale: lang,
    settings,
    path: "/",
    title: settings.seo.defaultTitle || dict.meta.defaultTitle,
    description: settings.seo.defaultDescription || dict.meta.defaultDescription,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, settings] = await Promise.all([
    getDictionaryFor(lang),
    getSiteSettings(),
  ]);

  return (
    <>
      <HomeHero
        locale={locale}
        dict={dict}
        phone={settings.phone}
        phoneDisplay={settings.phoneDisplay || formatPhoneDisplay(settings.phone)}
      />

      <ServicesSection locale={locale} dict={dict} />
      <HowItWorks dict={dict} />
      <WhyUs dict={dict} />
      <CoverageArea dict={dict} settings={settings} />
      <FaqSection locale={locale} dict={dict} />
      <BlogSection locale={locale} dict={dict} />
      <CtaBanner locale={locale} dict={dict} className="pb-8 sm:pb-12" />
    </>
  );
}