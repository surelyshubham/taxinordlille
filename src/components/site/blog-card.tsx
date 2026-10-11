import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import { PostCover } from "@/components/site/post-cover";
import { Badge } from "@/components/ui/primitives";
import type { PostSummary } from "@/lib/blog/queries";
import { formatDate, readingMinutes } from "@/lib/utils";
import { localizedHref, localeTags, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Editorial card used by the blog listing, the homepage and the related-posts
 * rail. The whole card is one link target — the heading stays the accessible
 * name via `aria-labelledby`.
 */
export function BlogCard({
  post,
  locale,
  labels,
  className,
  priority = false,
}: {
  post: PostSummary;
  locale: Locale;
  labels: { readMore: string; minRead: string };
  className?: string;
  priority?: boolean;
}) {
  const href = localizedHref(locale, `/blog/${post.slug}`);
  const minutes = readingMinutes(post.excerpt ?? "");

  return (
    <article
      className={cn(
        "group surface-card edge-top relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:border-gold-700/60",
        className,
      )}
    >
      <PostCover post={post} priority={priority} className="m-0 rounded-none border-0 border-b" />

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-3">
          {post.categoryName ? (
            <Badge tone="gold">{post.categoryName}</Badge>
          ) : null}
          {post.publishedAt ? (
            <time
              dateTime={post.publishedAt.toISOString()}
              className="text-xs text-content-subtle"
            >
              {formatDate(post.publishedAt, localeTags[locale])}
            </time>
          ) : null}
        </div>

        <h3 className="mt-4 text-xl leading-snug">
          <Link
            href={href}
            className="transition-colors before:absolute before:inset-0 before:content-[''] hover:text-gold-200 focus-visible:outline-none"
          >
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-content-muted">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <span className="inline-flex items-center gap-1.5 text-xs text-content-subtle">
            <Clock aria-hidden="true" className="size-3.5" />
            {labels.minRead.replace("{minutes}", String(minutes))}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold-400 transition-transform duration-300 group-hover:translate-x-0.5">
            {labels.readMore}
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}