import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";

import { Prose } from "@/components/site/prose";
import { Badge } from "@/components/ui/primitives";
import { adminLabels } from "@/lib/admin/labels";
import { getPostById } from "@/lib/blog/queries";
import { extractHeadings } from "@/lib/sanitize";
import { formatDateTime, readingMinutes } from "@/lib/utils";

export const metadata: Metadata = {
  title: adminLabels.blog.previewTitle,
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Preview of an unpublished post.
 *
 * Renders the same `Prose` component and the same typography as the public
 * article page, so what the operator sees here is what visitors will get.
 * `noindex` plus the authenticated layout keeps it out of search results.
 */
export default async function PreviewPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id).catch(() => null);
  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const minutes = readingMinutes(post.content);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/admin/blog/${post.id}`}
          className="inline-flex items-center gap-2 text-sm text-content-muted transition-colors hover:text-gold-200"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {adminLabels.blog.editPost}
        </Link>

        <Badge tone="warning" className="gap-1.5">
          <Eye aria-hidden="true" className="size-3.5" />
          {adminLabels.blog.previewTitle}
        </Badge>
      </div>

      <p className="rounded-xl border border-warning/40 bg-warning/[0.08] px-4 py-3 text-sm text-[#e8bf80]">
        {adminLabels.blog.previewNotice}
      </p>

      {post.status === "publie" ? (
        <p className="text-xs text-content-subtle">
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-300 underline underline-offset-4 hover:text-gold-200"
          >
            {post.slug} →
          </a>
        </p>
      ) : null}

      <article className="surface-card rounded-2xl p-8 sm:p-12">
        <header className="border-b border-line pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs text-content-subtle">
            <Badge tone="gold">
              {adminLabels.blog.statuses[
                post.status as "brouillon" | "publie" | "archive"
              ]}
            </Badge>
            <span>{post.language === "fr" ? "FR" : "EN"}</span>
            {post.publishedAt ? (
              <span>
                {adminLabels.blog.publishedAt}{" "}
                {formatDateTime(post.publishedAt)}
              </span>
            ) : null}
            <span>
              {adminLabels.blog.minRead.replace("{minutes}", String(minutes))}
            </span>
          </div>

          <h1 className="mt-5 text-4xl leading-tight">{post.title}</h1>

          {post.excerpt ? (
            <p className="mt-5 text-lg leading-relaxed text-content-muted">
              {post.excerpt}
            </p>
          ) : null}

          {post.authorName ? (
            <p className="mt-5 text-sm text-content-subtle">{post.authorName}</p>
          ) : null}
        </header>

        {post.coverImageUrl ? (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl border border-line">
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt || post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            <Prose html={post.content} dropcap={minutes > 2} />
          </div>

          {headings.length >= 2 ? (
            <aside>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-500">
                Sommaire
              </h2>
              <ol className="mt-4 space-y-2.5 border-l border-line-strong pl-4 text-sm">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className="text-content-muted transition-colors hover:text-gold-200"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}
        </div>

        {post.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line-strong px-3 py-1 text-xs text-content-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}