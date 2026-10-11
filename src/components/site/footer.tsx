import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Logo } from "@/components/site/logo";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import {
  telHref,
  whatsappHref,
  type SiteSettings,
} from "@/lib/settings/schema";

export function SiteFooter({
  locale,
  dict,
  settings,
}: {
  locale: Locale;
  dict: Dictionary;
  settings: SiteSettings;
}) {
  const year = new Date().getFullYear();

  const navLinks = [
    { label: dict.nav.home, href: localizedHref(locale, "/") },
    { label: dict.nav.services, href: localizedHref(locale, "/services") },
    {
      label: dict.nav.quote,
      href: localizedHref(locale, "/demande-de-devis"),
    },
    { label: dict.nav.blog, href: localizedHref(locale, "/blog") },
    { label: dict.nav.contact, href: localizedHref(locale, "/contact") },
  ];

  const serviceLinks = [
    {
      label: dict.services.gare.name,
      href: localizedHref(locale, `/services/${dict.services.gare.slug}`),
    },
    {
      label: dict.services.aeroport.name,
      href: localizedHref(locale, `/services/${dict.services.aeroport.slug}`),
    },
    {
      label: dict.services.longe.name,
      href: localizedHref(locale, `/services/${dict.services.longe.slug}`),
    },
  ];

  const legalLinks = [
    {
      label: dict.legal.mentions.title,
      href: localizedHref(locale, "/mentions-legales"),
    },
    {
      label: dict.legal.privacy.title,
      href: localizedHref(locale, "/politique-de-confidentialite"),
    },
    {
      label: dict.legal.cookies.title,
      href: localizedHref(locale, "/gestion-des-cookies"),
    },
    // Required by the CC BY / CC BY-SA licences the photographs are published
    // under: the attribution has to be reachable from every page, not only
    // from the image itself.
    {
      label: locale === "fr" ? "Crédits photo" : "Photo credits",
      href: localizedHref(locale, "/credits-photographiques"),
    },
  ];

  const socials = [
    { key: "facebook", label: "Facebook", href: settings.social.facebook },
    { key: "instagram", label: "Instagram", href: settings.social.instagram },
    { key: "linkedin", label: "LinkedIn", href: settings.social.linkedin },
    { key: "x", label: "X", href: settings.social.x },
  ].filter((social) => social.href);

  const addressLine = [settings.address.street, settings.address.postalCode, settings.address.city]
    .filter(Boolean)
    .join(" ");

  return (
    <footer className="border-t border-line bg-surface/50">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div className="max-w-xs">
            <Logo locale={locale} variant="full" />
            <p className="mt-5 text-sm leading-relaxed text-content-muted">
              {dict.footer.tagline}
            </p>
            {settings.coverageArea ? (
              <p className="mt-4 flex items-start gap-2 text-sm text-content-subtle">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-600" />
                <span>{settings.coverageArea}</span>
              </p>
            ) : null}
          </div>

          <nav aria-labelledby="footer-nav">
            <h2
              id="footer-nav"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400"
            >
              {dict.footer.navTitle}
            </h2>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-services">
            <h2
              id="footer-services"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400"
            >
              {dict.footer.servicesTitle}
            </h2>
            <ul className="mt-5 space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
              {dict.footer.contactTitle}
            </h2>
            <ul className="mt-5 space-y-4 text-sm">
              <li>
                <a
                  href={telHref(settings.phone)}
                  className="group inline-flex items-center gap-3 text-content transition-colors hover:text-gold-200"
                >
                  <Phone
                    aria-hidden="true"
                    className="size-4 shrink-0 text-gold-600 transition-colors group-hover:text-gold-400"
                  />
                  {settings.phoneDisplay || settings.phone}
                </a>
              </li>
              {settings.whatsappNumber ? (
                <li>
                  <a
                    href={whatsappHref(settings.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 text-content transition-colors hover:text-gold-200"
                  >
                    <MessageCircle
                      aria-hidden="true"
                      className="size-4 shrink-0 text-gold-600 transition-colors group-hover:text-gold-400"
                    />
                    {dict.common.whatsapp}
                  </a>
                </li>
              ) : null}
              {settings.email ? (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="group inline-flex items-center gap-3 break-all text-content transition-colors hover:text-gold-200"
                  >
                    <Mail
                      aria-hidden="true"
                      className="size-4 shrink-0 text-gold-600 transition-colors group-hover:text-gold-400"
                    />
                    {settings.email}
                  </a>
                </li>
              ) : null}
              {addressLine ? (
                <li className="flex items-start gap-3 text-content-muted">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-gold-600"
                  />
                  <span>{addressLine}</span>
                </li>
              ) : null}
            </ul>

            {socials.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-lg border border-line-strong px-3 py-1.5 text-xs text-content-muted transition-colors hover:border-gold-500 hover:text-gold-200"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="rule-gold my-12" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs text-content-subtle">
            © {year} {settings.businessName}. {dict.footer.rights}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href} className="text-xs">
                  {link.label}
                </FooterLink>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 max-w-3xl text-xs leading-relaxed text-content-subtle">
          {dict.footer.disclaimer}
        </p>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-content-muted transition-colors hover:text-gold-200 ${className ?? "text-sm"}`}
    >
      {children}
    </Link>
  );
}