import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, User } from "lucide-react";

import { CtaBanner } from "@/components/site/cta-banner";
import { BlogCard } from "@/components/site/blog-card";
import { Prose } from "@/components/site/prose";
import { Badge } from "@/components/ui/primitives";
import {
  getPublishedPostBySlug,
  getRelatedPosts,
} from "@/lib/blog/queries";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import {
  isLocale,
  localizedHref,
  localeTags,
  type Locale,
} from "@/lib/i18n/config";
import { getSiteSettings, getSiteUrl } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  blogPostingSchema,
  breadcrumbSchema,
  serializeJsonLd,
} from "@/lib/seo/jsonld";
import { extractHeadings } from "@/lib/sanitize";
import { formatDate, readingMinutes } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const [dict, settings, post] = await Promise.all([
    getDictionaryFor(lang),
    getSiteSettings(),
    getPublishedPostBySlug(slug).catch(() => null),
  ]);

  if (!post) {
    return { title: dict.common.notFoundTitle, robots: { index: false, follow: false } };
  }

  return buildMetadata({
    locale: lang,
    settings,
    path: `/blog/${slug}`,
    title: post.seoTitle || `${post.title} | ${settings.businessName}`,
    description:
      post.seoDescription || post.excerpt || dict.blog.intro.slice(0, 160),
    image: post.coverImageUrl,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [dict, settings, post] = await Promise.all([
    getDictionaryFor(lang),
    getSiteSettings(),
    getPublishedPostBySlug(slug).catch(() => null),
  ]);

  // Drafts, archived posts and unknown slugs all 404 on the public site.
  if (!post) notFound();

  const isFr = locale === "fr";
  const categoryLabel = post.category
    ? isFr
      ? post.category.nameFr
      : post.category.nameEn
    : null;

  const headings = extractHeadings(post.content);
  const related = await getRelatedPosts(post, 3).catch(() => []);
  const minutes = readingMinutes(post.content);

  const crumbs = [
    { name: dict.nav.home, href: localizedHref(locale, "/") },
    { name: dict.blog.title, href: localizedHref(locale, "/blog") },
    { name: post.title, href: localizedHref(locale, `/blog/${post.slug}`) },
  ];

  const jsonLd = [
    breadcrumbSchema(crumbs, getSiteUrl()),
    blogPostingSchema(post, getSiteUrl(), locale, settings.businessName),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <article>
        {/* --- Header --- */}
        <header className="border-b border-line/70 bg-surface/30 pb-14 pt-32 sm:pb-16 sm:pt-40">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <Link
              href={localizedHref(locale, "/blog")}
              className="inline-flex items-center gap-2 text-sm text-content-muted transition-colors hover:text-gold-200"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {dict.blog.backToBlog}
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {categoryLabel ? <Badge tone="gold">{categoryLabel}</Badge> : null}
              {post.publishedAt ? (
                <time
                  dateTime={post.publishedAt.toISOString()}
                  className="text-xs text-content-subtle"
                >
                  {dict.common.publishedOn}{" "}
                  {formatDate(post.publishedAt, localeTags[locale])}
                </time>
              ) : null}
              <span className="inline-flex items-center gap-1.5 text-xs text-content-subtle">
                <Clock aria-hidden="true" className="size-3.5" />
                {dict.blog.minRead.replace("{minutes}", String(minutes))}
              </span>
            </div>

            <h1 className="mt-6 text-4xl leading-[1.1] sm:text-5xl">{post.title}</h1>

            {post.excerpt ? (
              <p className="mt-6 text-lg leading-relaxed text-content-muted">
                {post.excerpt}
              </p>
            ) : null}

            {post.authorName || settings.businessName ? (
              <p className="mt-7 inline-flex items-center gap-2 text-sm text-content-subtle">
                <User aria-hidden="true" className="size-3.5" />
                {dict.blog.byAuthor.replace(
                  "{author}",
                  post.authorName || settings.businessName,
                )}
              </p>
            ) : null}
          </div>
        </header>

        {/* --- Cover --- */}
        {post.coverImageUrl ? (
          <div className="mx-auto mt-12 max-w-4xl px-5 sm:px-8">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-line">
              <Image
                src={post.coverImageUrl}
                alt={post.coverImageAlt || post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        {/* --- Body + TOC --- */}
        <div className="mx-auto mt-14 max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            <div className="order-2 min-w-0 lg:order-1">
              <Prose html={post.content} dropcap={minutes > 2} />
            </div>

            {headings.length >= 2 ? (
              <aside className="order-1 lg:order-2">
                <nav
                  aria-label={dict.blog.tocTitle}
                  className="lg:sticky lg:top-28"
                >
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-500">
                    {dict.blog.tocTitle}
                  </h2>
                  <ol className="mt-5 space-y-3 border-l border-line-strong pl-5 text-sm">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          href={`#${heading.id}`}
                          className={
                            heading.level === 3
                              ? "block pl-3 text-content-muted transition-colors hover:text-gold-200"
                              : "block text-content transition-colors hover:text-gold-200"
                          }
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </aside>
            ) : null}
          </div>
        </div>

        {/* --- Tags --- */}
        {post.tags.length > 0 ? (
          <div className="mx-auto mt-14 max-w-3xl px-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs uppercase tracking-[0.18em] text-content-subtle">
                {dict.blog.taggedWith}
              </span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-line-strong px-3 py-1 text-xs text-content-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </article>

      <div className="mt-20">
        <CtaBanner
          locale={locale}
          dict={dict}
          className="px-5 sm:px-8"
          eyebrow={dict.blog.shareTitle}
        />
        <p className="sr-only">{dict.blog.shareBody}</p>
      </div>

      {/* --- Related --- */}
      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <h2 className="text-2xl sm:text-3xl">{dict.blog.relatedTitle}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <BlogCard
                key={item.id}
                post={item}
                locale={locale}
                labels={{
                  readMore: dict.common.readArticle,
                  minRead: dict.blog.minRead,
                }}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="sr-only">{dict.blog.relatedEmpty}</p>
      )}
    </>
  );
}
