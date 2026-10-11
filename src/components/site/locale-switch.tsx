"use client";

import Link from "next/link";
import { Globe } from "lucide-react";

import {
  alternateLocale,
  localizedHref,
  type Locale,
} from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** Remove any existing locale prefix so the path can be re-localised cleanly. */
function stripLocale(pathname: string): string {
  const [, rest] = pathname.split(/^\/(fr|en)(?=\/|$)/);
  const stripped = rest ?? pathname;
  return stripped === "" ? "/" : stripped;
}

export function LocaleSwitch({
  locale,
  switchTo,
  shortLabel,
  currentLang,
  label,
  pathname,
  variant = "compact",
}: {
  locale: Locale;
  switchTo: string;
  shortLabel: string;
  currentLang: string;
  label: string;
  pathname: string;
  variant?: "compact" | "full";
}) {
  const target = alternateLocale(locale);
  const href = localizedHref(target, stripLocale(pathname));

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong text-xs font-semibold text-gold-200 transition-colors hover:border-gold-500 hover:bg-gold-400/10",
    variant === "compact" ? "h-9 px-2.5" : "h-11 w-full px-4 text-sm",
  );

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={`${label} : ${switchTo}`}
      className={classes}
    >
      <Globe aria-hidden="true" className="size-4 shrink-0" />
      <span>
        <span className="sr-only">{`${label} : ${currentLang}. `}</span>
        {shortLabel}
      </span>
    </Link>
  );
}