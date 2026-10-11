"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Admin error boundary.
 *
 * Deliberately terse: an operator hitting an error needs to know whether to
 * retry or to log out, not to read a stack trace.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="text-2xl">Erreur interne</h1>
        <p className="mt-4 text-sm leading-relaxed text-content-muted">
          Cette page n&apos;a pas pu être affichée. Réessayez ; si le problème
          persiste, vérifiez que la base de données est accessible.
        </p>

        {error.digest ? (
          <p className="mt-3 text-xs text-content-subtle">
            Référence : {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>Réessayer</Button>
          <Button asChild variant="outline">
            <Link href="/admin">Tableau de bord</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}