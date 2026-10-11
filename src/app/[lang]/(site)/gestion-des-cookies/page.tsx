import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPage } from "@/components/site/legal-page";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getSiteSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/gestion-des-cookies";

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
    path: PATH,
    title: dict.legal.cookies.title,
    description: dict.legal.cookies.intro,
  });
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [dict, settings] = await Promise.all([getDictionaryFor(lang), getSiteSettings()]);

  return <LegalPage locale={locale} dict={dict} settings={settings} kind="cookies" />;
}