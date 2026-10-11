import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { MobileActionBar } from "@/components/site/mobile-action-bar";
import { SiteContactProvider } from "@/components/site/contact-context";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import { isLocale, localizedHref } from "@/lib/i18n/config";
import { getSiteSettings, getSiteUrl } from "@/lib/settings";
import { formatPhoneDisplay } from "@/lib/settings/schema";
import {
  breadcrumbSchema,
  organizationSchema,
  serializeJsonLd,
  taxiServiceSchema,
} from "@/lib/seo/jsonld";

/**
 * Public-site chrome.
 *
 * Route groups keep the admin panel out of this layout entirely, so an admin
 * screen never inherits the marketing header, footer or mobile action bar.
 *
 * This is also where the editable business settings are read: the root layout
 * stays database-free so the sign-in screen still renders if Neon is down.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [dict, settings] = await Promise.all([
    getDictionaryFor(lang),
    getSiteSettings(),
  ]);
  const siteUrl = getSiteUrl();

  const jsonLd = [
    organizationSchema(settings, siteUrl, lang),
    taxiServiceSchema(
      settings,
      siteUrl,
      lang,
      [
        dict.services.gare.name,
        dict.services.aeroport.name,
        dict.services.longe.name,
      ],
    ),
    breadcrumbSchema(
      [
        { name: dict.nav.home, href: localizedHref(lang, "/") },
        { name: dict.nav.services, href: localizedHref(lang, "/services") },
      ],
      siteUrl,
    ),
  ];

  return (
    <SiteContactProvider
      value={{
        businessName: settings.businessName,
        phone: settings.phone,
        phoneDisplay:
          settings.phoneDisplay || formatPhoneDisplay(settings.phone),
        whatsappNumber: settings.whatsappNumber,
        email: settings.email,
      }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
      >
        {lang === "fr" ? "Aller au contenu principal" : "Skip to main content"}
      </a>

      <script
        type="application/ld+json"
        // Serialised from validated, code-owned objects — never user input.
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <SiteHeader
        locale={lang}
        nav={{
          home: dict.nav.home,
          services: dict.nav.services,
          quote: dict.nav.quote,
          blog: dict.nav.blog,
          contact: dict.nav.contact,
          openMenu: dict.nav.openMenu,
          closeMenu: dict.nav.closeMenu,
          primaryCta: dict.nav.primaryCta,
          call: dict.nav.call,
        }}
        language={{
          switchTo: dict.nav.switchTo,
          switchToShort: dict.nav.switchToShort,
          currentLang: dict.nav.currentLang,
          label: dict.nav.language,
        }}
      />

      {/* `pb-24` clears the fixed mobile action bar on small screens. */}
      <main id="main" className="pb-24 lg:pb-0">
        {children}
      </main>

      <SiteFooter locale={lang} dict={dict} settings={settings} />

      <WhatsAppFab label={dict.common.whatsappUs} />
      <MobileActionBar
        quoteHref={localizedHref(lang, "/demande-de-devis")}
        labels={{
          call: dict.nav.call,
          whatsapp: dict.common.whatsapp,
          quote: dict.common.requestQuote,
        }}
      />
    </SiteContactProvider>
  );
}