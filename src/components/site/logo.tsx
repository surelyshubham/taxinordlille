import Image from "next/image";
import Link from "next/link";

import { localizedHref, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Brand lockup built on the real assets in `public/brand`.
 *
 * `logo-mark.png` is the laurel-and-car emblem, cut out of the medallion by
 * `scripts/prepare-logo.mjs` and masked to its own oval. It is deliberately
 * not square — a square crop reaches into the medallion's ring and drags
 * arcs of it in — so it is sized by height and its width follows.
 *
 * The wordmark beside it is live text in the brand serif, so it stays crisp at
 * any size and is readable by assistive technology rather than being trapped
 * inside a bitmap.
 *
 * `logo-seal.png` is the complete medallion, used where there is room for it.
 */
export function Logo({
  locale,
  className,
  variant = "full",
}: {
  locale: Locale;
  className?: string;
  /** `full` = emblem + wordmark (header/footer). `seal` = medallion only. */
  variant?: "full" | "seal" | "mark";
}) {
  const href = localizedHref(locale, "/");

  if (variant === "seal") {
    return (
      <Link
        href={href}
        className={cn(
          "group inline-flex rounded-full",
          className,
        )}
        aria-label="Taxi Nord Lille — accueil"
      >
        <Image
          src="/brand/logo-seal.png"
          alt="Taxi Nord Lille"
          width={512}
          height={512}
          className="size-full transition-transform duration-500 group-hover:scale-[1.03]"
          priority
        />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 rounded-lg",
        className,
      )}
      aria-label="Taxi Nord Lille — accueil"
    >
      <Image
        src="/brand/logo-mark.png"
        alt=""
        aria-hidden="true"
        width={256}
        height={215}
        className={cn(
          // `w-auto` with a fixed height lets the emblem keep its own
          // proportions. Without it the `width` attribute decides the box and
          // the image is squashed.
          "w-auto shrink-0 transition-transform duration-500 group-hover:scale-105",
          variant === "mark" ? "h-9" : "h-11",
        )}
        priority
      />
      <span
        className={cn(
          "font-[family-name:var(--font-display)] font-medium uppercase leading-none tracking-[0.2em] text-gold-100 transition-colors duration-300 group-hover:text-gold-50",
          variant === "mark" ? "text-base" : "text-[0.95rem]",
        )}
      >
        Taxi Nord Lille
      </span>
    </Link>
  );
}