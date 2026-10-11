import Link from "next/link";

import { Button } from "@/components/ui/button";
import { localizedHref, type Locale } from "@/lib/i18n/config";

/**
 * Locale-aware 404. Rendered inside the site layout so it keeps the header,
 * footer and mobile action bar.
 */
export default function NotFound() {
  // `params` is not available here, so default to French — the primary market.
  const locale: Locale = "fr";

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 py-32 sm:px-8">
      <div className="mx-auto max-w-lg text-center">
        <p className="font-[family-name:var(--font-display)] text-7xl text-gold-800">404</p>
        <h1 className="mt-6 text-3xl sm:text-4xl">Page introuvable</h1>
        <p className="mt-5 leading-relaxed text-content-muted">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={localizedHref(locale, "/")}>Retour à l&apos;accueil</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={localizedHref(locale, "/contact")}>Nous contacter</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
