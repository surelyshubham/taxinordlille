import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Eyebrow } from "@/components/ui/primitives";
import type { BreadcrumbEntry } from "@/lib/seo/jsonld";
import { cn } from "@/lib/utils";

/**
 * Shared masthead for every inner page, so service pages, the quote page and
 * the blog all open with the same rhythm and the same amount of breathing room.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  breadcrumbs,
  homeLabel,
  children,
  className,
  compact = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  breadcrumbs?: BreadcrumbEntry[];
  homeLabel: string;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-line/70",
        compact ? "pb-14 pt-32 sm:pb-16 sm:pt-36" : "pb-16 pt-32 sm:pb-20 sm:pt-40",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_20%_0%,rgba(212,182,104,0.09),transparent_65%)]"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {breadcrumbs?.length ? (
          <div className="mb-8">
            <Breadcrumbs items={breadcrumbs} homeLabel={homeLabel} />
          </div>
        ) : null}

        <div className={cn(compact ? "max-w-3xl" : "max-w-3xl")}>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1
            className={cn(
              "mt-5",
              compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
            )}
          >
            {title}
          </h1>
          {intro ? (
            <div className="mt-6 text-lg leading-relaxed text-content-muted">
              {intro}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}