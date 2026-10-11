import { PHOTOS, photoFallbackWidth, photoWidths, type PhotoName } from "@/lib/photos";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * One of the licensed photographs on the site.
 *
 * `scripts/process-photos.mjs` emits every crop at four widths in AVIF, WebP
 * and JPEG, so this renders a `<picture>` with real `srcset`s and lets the
 * browser pick. That is deliberate rather than routing through `next/image`:
 * the files are already encoded at the right sizes and quality, and handing
 * them to the optimiser would only re-compress them and add a runtime cost.
 *
 * The fallback `<img>` carries the intrinsic size so the layout reserves the
 * right box before anything loads — without it every image would shift the
 * page as it arrives.
 */
export function Photo({
  name,
  locale,
  sizes = "100vw",
  className,
  priority = false,
  width = 1600,
  height = 900,
}: {
  name: PhotoName;
  locale: Locale;
  sizes?: string;
  className?: string;
  /** Above-the-fold images should skip lazy-loading. */
  priority?: boolean;
  /** Intrinsic size of the fallback, for layout stability. */
  width?: number;
  height?: number;
}) {
  const photo = PHOTOS[name];
  const widths = photoWidths(name);
  // A narrow source does not produce every width. Clamp the fallback to a
  // file that exists rather than advertising a 404 through `src`.
  const fallbackWidth = widths.includes(width)
    ? width
    : photoFallbackWidth(name, width);
  const fallbackHeight = Math.round((fallbackWidth / width) * height);

  const srcSet = (extension: string) =>
    widths
      .map((available) => `/images/places/${name}-${available}.${extension} ${available}w`)
      .join(", ");

  return (
    <picture>
      <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
      <img
        src={`/images/places/${name}-${fallbackWidth}.jpg`}
        alt={photo.alt[locale]}
        width={fallbackWidth}
        height={fallbackHeight}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        // The hero image is the LCP element; fetching it late would stall it.
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        className={cn("block h-full w-full object-cover", className)}
      />
    </picture>
  );
}

/**
 * Standard scrim for text placed over a photograph.
 *
 * The photographs are already tone-mapped dark, but a headline still needs a
 * guaranteed contrast floor — this takes the image to near-black on the side
 * the text sits, so the gold type never has to compete with the picture.
 */
export function PhotoScrim({
  className,
  from = "left",
}: {
  className?: string;
  from?: "left" | "bottom" | "full";
}) {
  const gradients = {
    left: "bg-[linear-gradient(90deg,rgba(5,4,4,0.96)_0%,rgba(5,4,4,0.82)_38%,rgba(5,4,4,0.35)_68%,rgba(5,4,4,0.6)_100%)]",
    bottom:
      "bg-[linear-gradient(180deg,rgba(5,4,4,0.25)_0%,rgba(5,4,4,0.7)_55%,rgba(5,4,4,0.97)_100%)]",
    full: "bg-[linear-gradient(180deg,rgba(5,4,4,0.72)_0%,rgba(5,4,4,0.82)_50%,rgba(5,4,4,0.96)_100%)]",
  };

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", gradients[from], className)}
    />
  );
}
