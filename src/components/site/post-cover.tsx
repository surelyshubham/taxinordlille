import Image from "next/image";

import { ArtAbstract } from "@/components/brand/artwork";
import type { PostSummary } from "@/lib/blog/queries";
import { cn } from "@/lib/utils";

/**
 * Cover image for an article.
 *
 * Falls back to a brass-tinted panel carrying the brand emblem at low opacity,
 * which reads as a deliberate design choice rather than a missing image.
 */
export function PostCover({
  post,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
}: {
  post: Pick<
    PostSummary,
    "coverImageUrl" | "coverImageAlt" | "title" | "coverImageWidth" | "coverImageHeight"
  >;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const ratio = post.coverImageWidth && post.coverImageHeight
    ? post.coverImageWidth / post.coverImageHeight
    : 16 / 9;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-line bg-surface-2",
        className,
      )}
      style={{ aspectRatio: String(ratio) }}
    >
      {post.coverImageUrl ? (
        <Image
          src={post.coverImageUrl}
          // Alt text is authored in the admin panel; the title is a safe default
          // when the owner has not written one yet.
          alt={post.coverImageAlt || post.title}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(212,182,104,0.16), transparent 70%), linear-gradient(160deg, #16130d, #0b0a08)",
            }}
          />
          <ArtAbstract className="absolute inset-0 size-full opacity-70" />
        </>
      )}
    </div>
  );
}