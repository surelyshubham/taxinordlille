import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { BreadcrumbEntry } from "@/lib/seo/jsonld";

/**
 * Visual breadcrumb trail. The matching `BreadcrumbList` structured data is
 * emitted separately so the markup stays clean.
 */
export function Breadcrumbs({
  items,
  homeLabel,
}: {
  items: BreadcrumbEntry[];
  homeLabel: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Fil d'Ariane">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-content-subtle">
        <li className="flex items-center gap-1.5">
          <Link href={items[0]!.href} className="transition-colors hover:text-gold-300">
            {homeLabel}
          </Link>
          <ChevronRight aria-hidden="true" className="size-3 text-gold-700" />
        </li>
        {items.slice(1).map((item, index) => {
          const isLast = index === items.length - 2;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="text-content-muted">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-gold-300"
                  >
                    {item.name}
                  </Link>
                  <ChevronRight aria-hidden="true" className="size-3 text-gold-700" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}