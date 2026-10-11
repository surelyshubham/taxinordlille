"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary.
 *
 * Shows a recoverable message rather than a stack trace, and never leaks
 * server internals to the visitor.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced server-side too, but log it where the team will see it.
    console.error("[site] render error:", error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 py-32 sm:px-8">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl sm:text-4xl">Une erreur est survenue</h1>
        <p className="mt-5 leading-relaxed text-content-muted">
          La page n&apos;a pas pu être affichée. Merci de réessayer, ou contactez-nous
          directement si le problème persiste.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-content-subtle">
            Référence technique : {error.digest}
          </p>
        ) : null}

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            Réessayer
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">Nous contacter</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}