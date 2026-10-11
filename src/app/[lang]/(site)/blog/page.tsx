import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

import { BlogCard } from "@/components/site/blog-card";
import { PostCover } from "@/components/site/post-cover";
import { PageHero } from "@/components/site/page-hero";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { getCategoriesWithCounts, getPublishedPosts } from "@/lib/blog/queries";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { getSiteSettings, getSiteUrl } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, serializeJsonLd } from "@/lib/seo/jsonld";
import { formatDate, readingMinutes } from "@/lib/utils";
import { localeTags } from "@/lib/i18n/config";

const PER_PAGE = 9;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [dict, settings] = await Promise.all([getDictionaryFor(lang), getSiteSettings()]);

  return buildMetadata({
    locale: lang,
    settings,
    path: "/blog",
    title: dict.blog.title,
    description: dict.blog.intro,
  });
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const rawCategory = query.categorie ?? query.category;
  const categorySlug = Array.isArray(rawCategory)
    ? rawCategory[0]
    : rawCategory;

  const rawPage = query.page;
  const page = Math.max(
    1,
    Number.parseInt(Array.isArray(rawPage) ? rawPage[0] : (rawPage ?? "1"), 10) || 1,
  );

  const dict = await getDictionaryFor(lang);

  // A database problem must not 500 the blog index.
  const [listing, categories] = await Promise.all([
    getPublishedPosts(locale, {
      limit: PER_PAGE,
      offset: (page - 1) * PER_PAGE,
      categorySlug,
    }).catch((error) => {
      console.warn("[blog] listing unavailable:", error);
      return { posts: [], total: 0, usedFallback: false };
    }),
    getCategoriesWithCounts().catch(() => []),
  ]);

  const totalPages = Math.max(1, Math.ceil(listing.total / PER_PAGE));
  const [featured, ...rest] = listing.posts;

  const crumbs = [
    { name: dict.nav.home, href: localizedHref(locale, "/") },
    { name: dict.blog.title, href: localizedHref(locale, "/blog") },
  ];

  const buildPageHref = (target: number) => {
    const url = new URLSearchParams();
    if (categorySlug) url.set("category", categorySlug);
    if (target > 1) url.set("page", String(target));
    const query = url.toString();
    return `${localizedHref(locale, "/blog")}${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbSchema(crumbs, getSiteUrl())),
        }}
      />

      <PageHero
        eyebrow={dict.nav.blog}
        title={dict.blog.title}
        intro={dict.blog.intro}
        homeLabel={dict.nav.breadcrumbHome}
        breadcrumbs={crumbs}
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* --- Category filter --- */}
          {categories.length > 0 ? (
            <nav aria-label={dict.blog.categories} className="mb-14 flex flex-wrap gap-2">
              <FilterChip
                href={buildPageHref(1)}
                active={!categorySlug}
                label={dict.blog.allCategories}
              />
              {categories
                .filter((category) => category.count > 0)
                .map((category) => (
                  <FilterChip
                    key={category.slug}
                    href={`${localizedHref(locale, "/blog")}?category=${category.slug}`}
                    active={categorySlug === category.slug}
                    label={`${category.name} (${category.count})`}
                  />
                ))}
            </nav>
          ) : null}

          {listing.posts.length === 0 ? (
            <EmptyState
              icon={<BookOpen aria-hidden="true" className="size-8" />}
              title={dict.blog.emptyTitle}
              description={dict.blog.emptyBody}
              action={
                <Link
                  href={localizedHref(locale, "/contact")}
                  className="text-sm font-semibold text-gold-300 hover:text-gold-200"
                >
                  {dict.nav.contact}
                </Link>
              }
            />
          ) : (
            <>
              {/* --- Featured --- */}
              {page === 1 && featured ? (
                <article className="group surface-card edge-top mb-8 grid overflow-hidden rounded-2xl transition-colors duration-300 hover:border-gold-700/60 lg:grid-cols-2">
                  <PostCover
                    post={featured}
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="rounded-none border-0"
                  />
                  <div className="flex flex-col justify-center p-8 lg:p-12">
                    <Badge tone="gold" className="w-fit">
                      {dict.blog.featured}
                    </Badge>
                    <h2 className="mt-5 text-3xl leading-tight">
                      <Link
                        href={localizedHref(locale, `/blog/${featured.slug}`)}
                        className="transition-colors hover:text-gold-200"
                      >
                        {featured.title}
                      </Link>
                    </h2>
                    {featured.excerpt ? (
                      <p className="mt-4 leading-relaxed text-content-muted">
                        {featured.excerpt}
                      </p>
                    ) : null}
                    <p className="mt-6 text-xs text-content-subtle">
                      {featured.publishedAt
                        ? formatDate(featured.publishedAt, localeTags[locale])
                        : ""}
                      {" · "}
                      {dict.blog.minRead.replace(
                        "{minutes}",
                        String(readingMinutes(featured.excerpt ?? "")),
                      )}
                    </p>
                  </div>
                </article>
              ) : null}

              {/* --- Grid --- */}
              {page === 1 && rest.length > 0 ? (
                <h2 className="sr-only">{dict.blog.latest}</h2>
              ) : null}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    locale={locale}
                    labels={{
                      readMore: dict.common.readArticle,
                      minRead: dict.blog.minRead,
                    }}
                  />
                ))}
              </div>

              {/* --- Pagination --- */}
              {totalPages > 1 ? (
                <nav
                  aria-label={dict.common.page}
                  className="mt-14 flex items-center justify-center gap-3"
                >
                  <PageButton
                    href={buildPageHref(page - 1)}
                    disabled={page <= 1}
                    label={dict.common.page}
                  >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                  </PageButton>

                  <span className="px-4 text-sm text-content-muted">
                    {page} / {totalPages}
                  </span>

                  <PageButton
                    href={buildPageHref(page + 1)}
                    disabled={page >= totalPages}
                    label={dict.common.page}
                  >
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </PageButton>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </section>
    </>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "inline-flex items-center rounded-full border border-gold-400 bg-gold-400/12 px-4 py-2 text-sm font-medium text-gold-200"
          : "inline-flex items-center rounded-full border border-line-strong px-4 py-2 text-sm text-content-muted transition-colors hover:border-gold-600 hover:text-gold-200"
      }
    >
      {label}
    </Link>
  );
}

function PageButton({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex size-11 items-center justify-center rounded-xl border border-line-strong text-content-muted transition-colors hover:border-gold-600 hover:text-gold-200 disabled:pointer-events-none disabled:opacity-35";

  if (disabled) {
    return (
      <span className={className} aria-disabled="true" aria-label={label}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} aria-label={label}>
      {children}
    </Link>
  );
}