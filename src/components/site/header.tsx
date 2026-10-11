"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Phone, X } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { useSiteContact } from "@/components/site/contact-context";
import { LocaleSwitch } from "@/components/site/locale-switch";
import { Button } from "@/components/ui/button";
import { alternateLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { telHref } from "@/lib/settings/schema";
import { cn } from "@/lib/utils";

export type NavStrings = {
  home: string;
  services: string;
  quote: string;
  blog: string;
  contact: string;
  openMenu: string;
  closeMenu: string;
  primaryCta: string;
  call: string;
};

const NAV_ITEMS = [
  { key: "home", href: "/" },
  { key: "services", href: "/services" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
] as const satisfies ReadonlyArray<{
  key: keyof NavStrings;
  href: string;
}>;

export function SiteHeader({
  locale,
  nav,
  language,
}: {
  locale: Locale;
  nav: NavStrings;
  language: { switchTo: string; switchToShort: string; currentLang: string; label: string };
}) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();
  const { phone, phoneDisplay } = useSiteContact();

  // Close the drawer when the route changes. Adjusting state during render (the
  // React-recommended pattern) rather than in an effect avoids the extra
  // render pass and the cascading-update warning.
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Lock body scroll while the drawer is open.
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the drawer.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => {
    const target = localizedHref(locale, href);
    return href === "/" ? pathname === target : pathname.startsWith(target);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled || open
            ? "border-b border-line bg-canvas/92 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Logo locale={locale} />

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={localizedHref(locale, item.href)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-[0.9rem] font-medium transition-colors",
                  isActive(item.href)
                    ? "text-gold-300"
                    : "text-content-muted hover:text-gold-200",
                )}
              >
                {nav[item.key]}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-gold-400 transition-transform duration-300",
                    isActive(item.href)
                      ? "scale-x-100"
                      : "scale-x-0",
                  )}
                />
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <LocaleSwitch
              locale={locale}
              switchTo={language.switchTo}
              shortLabel={language.switchToShort}
              currentLang={language.currentLang}
              label={language.label}
              pathname={pathname}
            />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 font-semibold"
            >
              <a href={telHref(phone)}>
                <Phone aria-hidden="true" />
                <span>{phoneDisplay || nav.call}</span>
              </a>
            </Button>
            <Button asChild size="sm" className="px-4">
              <Link href={localizedHref(locale, "/demande-de-devis")}>
                {nav.primaryCta}
              </Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? nav.closeMenu : nav.openMenu}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-line-strong text-gold-200 transition-colors hover:border-gold-500 hover:bg-gold-400/10 lg:hidden"
          >
            {open ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-canvas/95 backdrop-blur-xl lg:hidden"
          >
            <nav
              id="mobile-navigation"
              aria-label="Navigation mobile"
              className="flex h-full flex-col px-5 pb-8 pt-28"
            >
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item, index) => (
                  <motion.li
                    key={item.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + index * 0.05, duration: 0.3 }}
                  >
                    <Link
                      href={localizedHref(locale, item.href)}
                      className={cn(
                        "flex items-center justify-between border-b border-line/70 py-4 text-lg font-medium transition-colors",
                        isActive(item.href)
                          ? "text-gold-300"
                          : "text-content hover:text-gold-200",
                      )}
                    >
                      {nav[item.key]}
                      <span aria-hidden="true" className="text-gold-700">
                        →
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.3 }}
                className="mt-auto space-y-3"
              >
                <Button asChild size="lg" block>
                  <Link href={localizedHref(locale, "/demande-de-devis")}>
                    {nav.primaryCta}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" block>
                  <a href={telHref(phone)}>
                    <Phone aria-hidden="true" />
                    {phoneDisplay || nav.call}
                  </a>
                </Button>
                <div className="flex justify-center pt-2">
                  <LocaleSwitch
                    locale={locale}
                    switchTo={language.switchTo}
                    shortLabel={language.switchToShort}
                    currentLang={language.currentLang}
                    label={language.label}
                    pathname={pathname}
                    variant="full"
                  />
                </div>
              </motion.div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** Re-exported so pages can build language-switch targets without importing config twice. */
export { alternateLocale };